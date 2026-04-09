defmodule Zaynetro.Images.DiskCache do
  @moduledoc """
  Disk-based cache for resized images.

  Cache key: `{cache_dir}/{post_slug}/{filename}_{w}w.png`
  Atomic writes via temp file + File.rename/2.
  """

  @spec get(String.t(), String.t(), pos_integer()) :: {:ok, binary()} | :miss
  def get(cache_dir, id, width) do
    path = cache_path(cache_dir, id, width)

    case File.read(path) do
      {:ok, bytes} -> {:ok, bytes}
      _ -> :miss
    end
  end

  @spec put(String.t(), String.t(), pos_integer(), binary()) :: :ok | {:error, term()}
  def put(cache_dir, id, width, bytes) do
    path = cache_path(cache_dir, id, width)
    tmp = path <> ".tmp"
    File.mkdir_p!(Path.dirname(path))

    with :ok <- File.write(tmp, bytes),
         :ok <- File.rename(tmp, path) do
      :ok
    end
  end

  @spec cache_path(String.t(), String.t(), pos_integer()) :: String.t()
  def cache_path(cache_dir, id, width) do
    dir = Path.dirname(id)
    base = Path.basename(id, Path.extname(id))
    Path.join([cache_dir, dir, "#{base}_#{width}w.png"])
  end
end
