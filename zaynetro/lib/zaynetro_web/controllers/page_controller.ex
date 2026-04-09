defmodule ZaynetroWeb.PageController do
  use ZaynetroWeb, :controller

  alias Zaynetro.Blog.Cache

  def index(conn, _params) do
    posts = Cache.list_published_posts()
    render(conn, :index, posts: posts)
  end

  def about(conn, _params) do
    render(conn, :about)
  end

  def explainix(conn, _params) do
    render(conn, :explainix,
      extra_head: ~s(<script defer src="/assets/explainix.js"></script>)
    )
  end
end
