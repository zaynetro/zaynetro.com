defmodule ZaynetroWeb.PostController do
  use ZaynetroWeb, :controller

  alias Zaynetro.Blog.{Cache, GfmCss}

  def show(conn, %{"slug" => slug}) do
    case Cache.get_post(slug) do
      {:ok, post} ->
        extra_head =
          if post.has_mermaid do
            ~s(<script defer src="/assets/mermaid.js"></script>)
          else
            ""
          end

        conn
        |> assign(:page_title, post.title)
        |> assign(:meta_description, post.description)
        |> assign(:post_styles, "<style>#{GfmCss.all()}</style>")
        |> assign(:extra_head, extra_head)
        |> render(:show, post: post)

      {:error, :not_found} ->
        conn |> put_status(404) |> put_view(ZaynetroWeb.ErrorHTML) |> render(:"404")
    end
  end
end
