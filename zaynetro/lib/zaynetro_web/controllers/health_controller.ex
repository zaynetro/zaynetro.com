defmodule ZaynetroWeb.HealthController do
  use ZaynetroWeb, :controller

  def check(conn, _params) do
    json(conn, %{status: "ok"})
  end
end
