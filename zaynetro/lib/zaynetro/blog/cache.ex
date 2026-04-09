defmodule Zaynetro.Blog.Cache do
  @moduledoc """
  ETS-backed in-memory cache for blog posts and image paths.

  Loads all posts at startup via `Blog.Loader`. Public API is process-independent
  (reads from ETS directly) so callers don't need to go through the GenServer.
  """

  use GenServer
  require Logger

  alias Zaynetro.Blog.{Loader, Post}

  @posts_table :blog_posts
  @images_table :blog_images

  # ── Public API ─────────────────────────────────────────────────────────────

  @spec get_post(String.t()) :: {:ok, Post.t()} | {:error, :not_found}
  def get_post(slug) do
    case :ets.lookup(@posts_table, slug) do
      [{^slug, post}] -> {:ok, post}
      [] -> {:error, :not_found}
    end
  end

  @spec list_published_posts() :: [Post.t()]
  def list_published_posts do
    hide_drafts = Application.get_env(:zaynetro, :hide_drafts, false)

    @posts_table
    |> :ets.tab2list()
    |> Enum.map(fn {_slug, post} -> post end)
    |> Enum.reject(fn post -> hide_drafts and post.draft end)
    |> Enum.sort_by(& &1.date, {:desc, Date})
  end

  @spec image_path(String.t()) :: {:ok, String.t()} | {:error, :not_found}
  def image_path(id) do
    case :ets.lookup(@images_table, id) do
      [{^id, path}] -> {:ok, path}
      [] -> {:error, :not_found}
    end
  end

  # ── GenServer ──────────────────────────────────────────────────────────────

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl GenServer
  def init(_opts) do
    :ets.new(@posts_table, [:set, :public, :named_table, read_concurrency: true])
    :ets.new(@images_table, [:set, :public, :named_table, read_concurrency: true])

    posts_dir = Application.get_env(:zaynetro, :posts_dir, "posts")

    Logger.info("Loading blog posts from #{posts_dir}")

    {posts, image_pairs} = Loader.load_all(posts_dir)

    Enum.each(posts, fn post ->
      :ets.insert(@posts_table, {post.slug, post})
    end)

    Enum.each(image_pairs, fn {id, path} ->
      :ets.insert(@images_table, {id, path})
    end)

    # Register static images from priv/static/images/
    register_static_images()

    Logger.info("Loaded #{length(posts)} posts, #{length(image_pairs)} post images")

    {:ok, %{}}
  end

  defp register_static_images do
    static_dir = Path.join(:code.priv_dir(:zaynetro), "static/images")

    case File.ls(static_dir) do
      {:ok, files} ->
        Enum.each(files, fn fname ->
          :ets.insert(@images_table, {fname, Path.join(static_dir, fname)})
        end)

      _ ->
        :ok
    end
  end
end
