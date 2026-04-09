defmodule Zaynetro.Blog.Renderer do
  @moduledoc """
  Renders blog post Markdown to HTML using MDEx.

  Single AST traversal handles:
  - TOC extraction from H2/H3 headings
  - Local image -> <picture> srcset transformation
  - <mermaid-block> and <labeled-img> custom tag transformation
  - has_mermaid / has_labeled_img flag detection (independent flags)
  """

  alias Zaynetro.Blog.{Slugger, TocHeading, TocEntry}

  @widths [400, 600, 800, 1000, 1200]

  @parse_opts [
    extension: [
      strikethrough: true,
      table: true,
      autolink: true,
      tasklist: true,
      footnotes: true,
      shortcodes: true
    ],
    render: [unsafe_: true]
  ]

  @render_opts [
    syntax_highlight: [formatter: :html_linked]
  ]

  @type render_result :: %{
          html: String.t(),
          toc: list(TocHeading.t()),
          has_mermaid: boolean(),
          has_labeled_img: boolean()
        }

  @spec render(String.t(), String.t()) :: {:ok, render_result()} | {:error, term()}
  def render(markdown, post_slug) when is_binary(markdown) and is_binary(post_slug) do
    doc = MDEx.parse_document!(markdown, @parse_opts)

    init_acc = %{
      toc: [],
      seen_slugs: %{},
      has_mermaid: false,
      has_labeled_img: false
    }

    {updated_doc, acc} =
      MDEx.traverse_and_update(doc, init_acc, fn node, a ->
        transform(node, a, post_slug)
      end)

    html = MDEx.to_html!(updated_doc, @render_opts)
    toc = build_toc(Enum.reverse(acc.toc))

    {:ok,
     %{
       html: html,
       toc: toc,
       has_mermaid: acc.has_mermaid,
       has_labeled_img: acc.has_labeled_img
     }}
  rescue
    e -> {:error, e}
  end

  # Heading nodes H2/H3: collect TOC entry + inject id attribute

  defp transform(%MDEx.Heading{level: level} = node, acc, _slug) when level in [2, 3] do
    text = extract_text(node.nodes)
    {id, seen_slugs} = Slugger.slugify(text, acc.seen_slugs)
    tag = "h#{level}"
    # Render the heading children to get proper inner HTML
    inner_doc = %MDEx.Document{nodes: node.nodes}
    inner_html = MDEx.to_html!(inner_doc, @render_opts)
    # Strip wrapping <p>...</p> if present
    inner = Regex.replace(~r/^<p>(.*)<\/p>\n?$/s, inner_html, "\\1")
    raw_html = ~s(<#{tag} id="#{id}">#{inner}</#{tag}>\n)
    entry = %{id: id, text: text, level: level}
    new_acc = %{acc | toc: [entry | acc.toc], seen_slugs: seen_slugs}
    {%MDEx.Raw{literal: raw_html}, new_acc}
  end

  # Image nodes: replace with <picture> srcset

  defp transform(%MDEx.Image{url: url} = node, acc, post_slug) do
    if local_image?(url) do
      alt = extract_text(node.nodes)
      id = build_image_id(url, post_slug)
      html = build_picture_html(id, alt)
      {%MDEx.Raw{literal: html}, acc}
    else
      {node, acc}
    end
  end

  # HtmlBlock: detect mermaid-block and labeled-img

  defp transform(%MDEx.HtmlBlock{literal: literal}, acc, slug) do
    cond do
      String.contains?(literal, "<mermaid-block") ->
        name = extract_attr(literal, "name")
        content = extract_inner_content(literal, "mermaid-block")

        html =
          ~s(<section class="mermaid-block">) <>
          ~s(<pre class="mermaid">#{content}</pre>) <>
          ~s(<div class="mermaid-label"><i>Diagram: #{name}</i></div>) <>
          ~s(</section>\n)

        {%MDEx.Raw{literal: html}, %{acc | has_mermaid: true}}

      String.contains?(literal, "<labeled-img") ->
        label = extract_attr(literal, "label")
        content = extract_inner_content(literal, "labeled-img")

        # Transform ./filename.png -> /img?id=post-slug/filename.png
        images_html = transform_img_srcs(content, slug)

        # Parse markdown in label (for links etc), strip wrapping <p> tag
        label_html =
          label
          |> MDEx.to_html!(extension: [autolink: true])
          |> String.replace(~r/\A<p>(.*)<\/p>\z/s, "\\1")

        html =
          ~s(<section class="img-block">) <>
          ~s(<div class="img-block-list">#{images_html}</div>) <>
          ~s(<div class="img-block-label">#{label_html}</div>) <>
          ~s(</section>\n)

        {%MDEx.Raw{literal: html}, %{acc | has_labeled_img: true}}

      true ->
        {%MDEx.HtmlBlock{literal: literal}, acc}
    end
  end

  # Pass-through for all other nodes

  defp transform(node, acc, _slug), do: {node, acc}

  # Build nested TocHeading structs from flat [{id, text, level}] list

  defp build_toc(flat_list) do
    flat_list
    |> Enum.reduce([], fn
      %{level: 2, id: id, text: text}, acc ->
        heading = %TocHeading{
          entry: %TocEntry{text: text, slug: id},
          subheadings: []
        }

        [heading | acc]

      %{level: 3, id: id, text: text}, [last | rest] ->
        sub = %TocEntry{text: text, slug: id}
        updated = %{last | subheadings: last.subheadings ++ [sub]}
        [updated | rest]

      _other, acc ->
        acc
    end)
    |> Enum.reverse()
  end

  # Helpers

  defp local_image?(url) do
    not String.starts_with?(url, "http://") and
      not String.starts_with?(url, "https://") and
      not String.starts_with?(url, "//") and
      url != ""
  end

  defp build_image_id(url, post_slug) do
    filename = url |> String.trim_leading("./") |> Path.basename()
    "#{post_slug}/#{filename}"
  end

  defp build_picture_html(id, alt) do
    encoded_id = URI.encode_www_form(id)

    srcset =
      @widths
      |> Enum.map(fn w -> "/img?id=#{encoded_id}&w=#{w} #{w}w" end)
      |> Enum.join(", ")

    default_src = "/img?id=#{encoded_id}&w=800"

    ~s(<picture>) <>
      ~s(<source srcset="#{srcset}" />) <>
      ~s(<img src="#{default_src}" alt="#{html_escape(alt)}" loading="lazy" />) <>
      ~s(</picture>)
  end

  defp extract_text(nodes) when is_list(nodes) do
    Enum.map_join(nodes, "", fn
      %MDEx.Text{literal: t} -> t
      %MDEx.Code{literal: t} -> t
      %{nodes: children} -> extract_text(children)
      _ -> ""
    end)
  end

  defp extract_text(_), do: ""

  defp transform_img_srcs(html, post_slug) do
    # Match src="./filename" or src="filename" (no scheme = local image)
    Regex.replace(~r/src="((?:\.\/)?(?!https?:\/\/|\/)[^"]+\.[a-z]{2,5})"/, html, fn _, path ->
      filename = String.trim_leading(path, "./")
      ~s(src="/img?id=#{post_slug}/#{filename}&orig=true")
    end)
  end

  defp extract_attr(html, attr) do
    case Regex.run(~r/#{attr}="([^"]*)"/, html) do
      [_, value] -> value
      _ -> ""
    end
  end

  defp extract_inner_content(html, tag) do
    case Regex.run(~r/<#{tag}[^>]*>(.*?)<\/#{tag}>/s, html) do
      [_, inner] -> inner
      _ -> html
    end
  end

  defp html_escape(str) do
    str
    |> String.replace("&", "&amp;")
    |> String.replace("<", "&lt;")
    |> String.replace(">", "&gt;")
    |> String.replace("\"", "&quot;")
  end
end
