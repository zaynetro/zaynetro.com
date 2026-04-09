defmodule Zaynetro.Images.Pipeline do
  @moduledoc """
  Unified public interface for image serving.

  All image requests — both the `/img` route and post HTML generation —
  go through this module.
  """

  alias Zaynetro.Blog.Cache
  alias Zaynetro.Images.{DiskCache, Queue}

  @spec resize_and_cache(String.t(), pos_integer()) :: {:ok, binary()} | {:error, term()}
  def resize_and_cache(id, width) do
    cache_dir = cache_dir()

    case DiskCache.get(cache_dir, id, width) do
      {:ok, bytes} ->
        {:ok, bytes}

      :miss ->
        with {:ok, path} <- Cache.image_path(id),
             {:ok, bytes} <- Queue.resize(path, width) do
          DiskCache.put(cache_dir, id, width, bytes)
          {:ok, bytes}
        end
    end
  end

  @spec serve_original(String.t()) :: {:ok, binary(), String.t()} | {:error, term()}
  def serve_original(id) do
    with {:ok, path} <- Cache.image_path(id),
         {:ok, bytes} <- File.read(path) do
      mime = mime_type(path)
      {:ok, bytes, mime}
    end
  end

  defp cache_dir do
    Application.get_env(
      :zaynetro,
      :image_cache_dir,
      Path.join(System.tmp_dir!(), "zaynetro/images")
    )
  end

  defp mime_type(path) do
    case Path.extname(path) |> String.downcase() do
      ".png" -> "image/png"
      ".jpg" -> "image/jpeg"
      ".jpeg" -> "image/jpeg"
      ".gif" -> "image/gif"
      ".webp" -> "image/webp"
      ".svg" -> "image/svg+xml"
      _ -> "application/octet-stream"
    end
  end
end
