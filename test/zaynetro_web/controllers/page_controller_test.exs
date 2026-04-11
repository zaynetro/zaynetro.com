defmodule ZaynetroWeb.PageControllerTest do
  use ZaynetroWeb.ConnCase

  test "GET / returns blog post listing", %{conn: conn} do
    conn = get(conn, ~p"/")
    assert html_response(conn, 200) =~ "zaynetro"
  end
end
