defmodule Zaynetro.Blog.Loader do
  @moduledoc """
  Loads all blog posts from the posts directory.

  Frontmatter format: TOML delimited by `+++` lines.
  Required fields: `title`, `date`.
  Optional: `description`, `draft` (default false), `[extra].preview_image`.

  Slug derivation:
  - `posts/{slug}/index.md` → slug is the directory name
  - `posts/{slug}.md`       → slug is the filename without extension
  """

  require Logger

  alias Zaynetro.Blog.{Post, Renderer, DiskCache}

  @spec load_all(String.t()) :: {[Post.t()], [{String.t(), String.t()}]}
  def load_all(posts_dir) do
    cache_dir = Application.get_env(:zaynetro, :cache_dir, System.tmp_dir!())

    post_files = discover_posts(posts_dir)

    {posts, image_pairs} =
      post_files
      |> Enum.map(fn {path, slug} ->
        try do
          load_file(path, slug, cache_dir)
        rescue
          e ->
            Logger.error("Failed to load post #{slug}: #{inspect(e)}")
            nil
        end
      end)
      |> Enum.reject(&is_nil/1)
      |> Enum.unzip()

    sorted_posts =
      posts
      |> Enum.sort_by(& &1.date, {:desc, Date})

    all_images = List.flatten(image_pairs)
    {sorted_posts, all_images}
  end

  @spec load_file(String.t(), String.t(), String.t()) ::
          {Post.t(), [{String.t(), String.t()}]}
  def load_file(path, slug, cache_dir \\ "") do
    content = File.read!(path)
    {frontmatter_str, markdown} = split_frontmatter(content)

    fm = parse_frontmatter(frontmatter_str)
    title = Map.fetch!(fm, "title")

    date =
      case Map.get(fm, "date") do
        nil -> raise ArgumentError, "Post #{slug} missing required field: date"
        d when is_binary(d) -> parse_date(d)
        other -> raise ArgumentError, "Post #{slug}: invalid date: #{inspect(other)}"
      end

    description = Map.get(fm, "description")
    draft = Map.get(fm, "draft", false)

    preview_image =
      case get_in(fm, ["extra", "preview_image"]) do
        nil -> nil
        %{"href" => id, "alt" => alt} -> %{id: "#{slug}/#{id}", alt: alt}
        %{"id" => id, "alt" => alt} -> %{id: "#{slug}/#{id}", alt: alt}
        _ -> nil
      end

    render_result =
      case DiskCache.get(cache_dir, slug) do
        {:ok, cached_html} ->
          # Cache hit - return with minimal metadata
          {:ok, result} = Renderer.render(markdown, slug)
          %{result | html: cached_html}

        :miss ->
          {:ok, result} = Renderer.render(markdown, slug)
          if cache_dir != "", do: DiskCache.put(cache_dir, slug, result.html)
          result
      end

    post = %Post{
      slug: slug,
      title: title,
      date: date,
      description: description,
      preview_image: preview_image,
      html: render_result.html,
      toc: render_result.toc,
      has_mermaid: render_result.has_mermaid,
      has_labeled_img: render_result.has_labeled_img,
      draft: draft
    }

    post_dir = Path.dirname(path)
    image_pairs = collect_image_pairs(post_dir, slug, preview_image)

    {post, image_pairs}
  end

  # ── Private ────────────────────────────────────────────────────────────────

  defp discover_posts(posts_dir) do
    case File.ls(posts_dir) do
      {:ok, entries} ->
        Enum.flat_map(entries, fn entry ->
          full = Path.join(posts_dir, entry)

          cond do
            File.dir?(full) ->
              index = Path.join(full, "index.md")
              if File.exists?(index), do: [{index, entry}], else: []

            String.ends_with?(entry, ".md") ->
              slug = Path.basename(entry, ".md")
              [{full, slug}]

            true ->
              []
          end
        end)

      {:error, reason} ->
        raise "Cannot read posts directory #{posts_dir}: #{inspect(reason)}"
    end
  end

  defp split_frontmatter(content) do
    case String.split(content, "+++", parts: 3) do
      [_, fm, md] -> {String.trim(fm), String.trim_leading(md)}
      _ -> {"", content}
    end
  end

  defp parse_frontmatter(""), do: %{}

  defp parse_frontmatter(str) do
    case Toml.decode(str) do
      {:ok, map} -> map
      {:error, reason} -> raise "TOML parse error: #{inspect(reason)}"
    end
  end

  defp parse_date(str) do
    # Accept ISO8601 with timezone offset, e.g. "2023-07-14T12:00:00+03:00"
    case Date.from_iso8601(String.slice(str, 0, 10)) do
      {:ok, date} -> date
      {:error, _} -> raise ArgumentError, "Cannot parse date: #{str}"
    end
  end

  defp collect_image_pairs(post_dir, slug, preview_image) do
    dir_images =
      case File.ls(post_dir) do
        {:ok, files} ->
          files
          |> Enum.filter(&image_file?/1)
          |> Enum.map(fn fname -> {"#{slug}/#{fname}", Path.join(post_dir, fname)} end)

        _ ->
          []
      end

    preview_pairs =
      case preview_image do
        %{id: id} -> [{id, Path.join(post_dir, Path.basename(id))}]
        _ -> []
      end

    (dir_images ++ preview_pairs)
    |> Enum.uniq_by(fn {id, _} -> id end)
  end

  defp image_file?(name) do
    ext = Path.extname(name) |> String.downcase()
    ext in [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]
  end
end
