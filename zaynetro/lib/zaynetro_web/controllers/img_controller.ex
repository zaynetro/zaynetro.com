defmodule ZaynetroWeb.ImgController do
  use ZaynetroWeb, :controller

  alias Zaynetro.Images.Pipeline

  # Allow only safe path characters: alphanumeric, hyphen, underscore, dot, forward slash.
  # The leading character must not be a dot or slash to prevent hidden-file or absolute paths.
  @valid_id ~r/\A[a-zA-Z0-9_\-][a-zA-Z0-9_\-\.\/]*\z/

  defp valid_id?(nil), do: false
  defp valid_id?(""), do: false

  defp valid_id?(id) do
    Regex.match?(@valid_id, id) and not String.contains?(id, "..")
  end

  def show(conn, params) do
    id = params["id"]
    w = params["w"]
    orig = params["orig"]
    v = params["v"]

    cond do
      is_nil(id) or id == "" ->
        conn |> put_status(400) |> text("id is missing")

      not valid_id?(id) ->
        conn |> put_status(400) |> text("invalid id")

      is_nil(w) and is_nil(orig) ->
        conn |> put_status(400) |> text("w or orig params are missing")

      true ->
        serve_image(conn, id, w, orig, v)
    end
  end

  defp serve_image(conn, id, _w, "true", v) do
    case Pipeline.serve_original(id) do
      {:ok, path, mime} ->
        conn
        |> put_cache_control(v)
        |> put_resp_content_type(mime)
        |> send_file(200, path)

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
          {:ok, path} ->
            conn
            |> put_cache_control(v)
            |> put_resp_content_type("image/png")
            |> send_file(200, path)

          {:error, :not_found} ->
            conn |> put_status(404) |> text("img not found")

          {:error, _reason} ->
            conn |> put_status(500) |> text("error resizing image")
        end

      _ ->
        conn |> put_status(400) |> text("invalid width")
    end
  end

  defp put_cache_control(conn, v) when not is_nil(v) and v != "" do
    put_resp_header(conn, "cache-control", "public, max-age=31536000, immutable")
  end

  defp put_cache_control(conn, _v) do
    put_resp_header(conn, "cache-control", "public, max-age=604800")
  end
end
