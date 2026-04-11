defmodule ZaynetroWeb.DevController do
  @moduledoc "Dev-only routes for previewing error pages etc."
  use ZaynetroWeb, :controller

  def not_found(conn, _params) do
    conn
    |> put_status(404)
    |> put_layout(false)
    |> put_view(ZaynetroWeb.ErrorHTML)
    |> render("404.html")
  end
end
