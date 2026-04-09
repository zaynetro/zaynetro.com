defmodule ZaynetroWeb.ImgController do
  use ZaynetroWeb, :controller

  alias Zaynetro.Images.Pipeline

  def show(conn, params) do
    id = params["id"]
    w = params["w"]
    orig = params["orig"]
    v = params["v"]

    cond do
      is_nil(id) or id == "" ->
        conn |> put_status(500) |> text("id is missing")

      is_nil(w) and is_nil(orig) ->
        conn |> put_status(500) |> text("w or orig params are missing")

      true ->
        serve_image(conn, id, w, orig, v)
    end
  end

  defp serve_image(conn, id, _w, "true", v) do
    case Pipeline.serve_original(id) do
      {:ok, bytes, mime} ->
        conn
        |> maybe_cache_forever(v)
        |> put_resp_content_type(mime)
        |> send_resp(200, bytes)

      {:error, :not_found} ->
        conn |> put_status(404) |> text("img not found")

      {:error, _reason} ->
        conn |> put_status(500) |> text("error serving image")
    end
  end

  defp serve_image(conn, id, w, _orig, v) do
    case Integer.parse(w || "") do
      {width, ""} ->
        case Pipeline.resize_and_cache(id, width) do
          {:ok, bytes} ->
            conn
            |> maybe_cache_forever(v)
            |> put_resp_content_type("image/png")
            |> send_resp(200, bytes)

          {:error, :not_found} ->
            conn |> put_status(404) |> text("img not found")

          {:error, _reason} ->
            conn |> put_status(500) |> text("error resizing image")
        end

      _ ->
        conn |> put_status(400) |> text("invalid width")
    end
  end

  defp maybe_cache_forever(conn, v) when not is_nil(v) and v != "" do
    put_resp_header(conn, "cache-control", "public, max-age=31536000, immutable")
  end

  defp maybe_cache_forever(conn, _v), do: conn
end
