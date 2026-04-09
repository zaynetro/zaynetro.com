defmodule ZaynetroWeb.HealthControllerTest do
  use ZaynetroWeb.ConnCase

  test "GET /healthz returns ok", %{conn: conn} do
    conn = get(conn, "/healthz")
    assert conn.status == 200
    assert conn.resp_body == ~s({"status":"ok"})
  end
end
