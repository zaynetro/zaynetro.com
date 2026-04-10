defmodule Zaynetro.Images.DiskCache do
  @moduledoc """
  Disk-based cache for resized images.

  Cache key: `{cache_dir}/{post_slug}/{filename}_{w}w.png`
  """

  @spec get(String.t(), String.t(), pos_integer()) :: {:ok, String.t()} | :miss
  def get(cache_dir, id, width) do
    path = cache_path(cache_dir, id, width)
    if File.exists?(path), do: {:ok, path}, else: :miss
  end

  @spec cache_path(String.t(), String.t(), pos_integer()) :: String.t()
  def cache_path(cache_dir, id, width) do
    dir = Path.dirname(id)
    base = Path.basename(id, Path.extname(id))
    Path.join([cache_dir, dir, "#{base}_#{width}w.png"])
  end
end
