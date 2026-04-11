defmodule ZaynetroWeb.PageController do
  use ZaynetroWeb, :controller

  alias Zaynetro.Blog.Cache

  def index(conn, _params) do
    posts = Cache.list_published_posts()

    conn
    |> assign(
      :meta_description,
      "Personal blog about software development, interesting projects, and technical discoveries."
    )
    |> render(:index, posts: posts)
  end

  def about(conn, _params) do
    conn
    |> assign(:page_title, "About")
    |> assign(
      :meta_description,
      "Hi, I'm Roman Zaynetdinov — a software developer writing about Elixir, Phoenix, and web development."
    )
    |> assign(:og_image, "/img?id=logo.jpg&w=400")
    |> render(:about)
  end

  def explainix(conn, _params) do
    conn
    |> assign(:page_title, "Explainix")
    |> assign(
      :meta_description,
      "Explain Nix syntax visually. Hover over any element to highlight its bounds. Click to display contextual help."
    )
    |> render(:explainix,
      extra_head: ~s(<script defer src="/assets/explainix.js"></script>)
    )
  end
end
