defmodule Zaynetro.Blog.DiskCache do
  @moduledoc """
  Disk-based cache for rendered blog post HTML.

  Cache layout:
    {cache_dir}/html/{slug}.html   — rendered HTML
    {cache_dir}/html/{slug}.sha256 — SHA-256 of source markdown (for invalidation)
  """

  @spec get(String.t(), String.t()) :: {:ok, String.t()} | :miss
  def get(cache_dir, slug) when is_binary(cache_dir) and is_binary(slug) do
    html_path = html_path(cache_dir, slug)
    sha_path = sha_path(cache_dir, slug)

    with true <- File.exists?(html_path),
         true <- File.exists?(sha_path),
         {:ok, html} <- File.read(html_path) do
      {:ok, html}
    else
      _ -> :miss
    end
  end

  @spec put(String.t(), String.t(), String.t()) :: :ok | {:error, term()}
  def put(cache_dir, slug, html)
      when is_binary(cache_dir) and is_binary(slug) and is_binary(html) do
    dir = Path.join(cache_dir, "html")
    File.mkdir_p!(dir)

    tmp = html_path(cache_dir, slug) <> ".tmp"

    with :ok <- File.write(tmp, html),
         :ok <- File.rename(tmp, html_path(cache_dir, slug)) do
      :ok
    end
  end

  @spec put_sha(String.t(), String.t(), String.t()) :: :ok | {:error, term()}
  def put_sha(cache_dir, slug, sha) do
    dir = Path.join(cache_dir, "html")
    File.mkdir_p!(dir)
    File.write(sha_path(cache_dir, slug), sha)
  end

  @spec current_sha(String.t(), String.t()) :: {:ok, String.t()} | :miss
  def current_sha(cache_dir, slug) do
    case File.read(sha_path(cache_dir, slug)) do
      {:ok, sha} -> {:ok, String.trim(sha)}
      _ -> :miss
    end
  end

  defp html_path(cache_dir, slug), do: Path.join([cache_dir, "html", "#{slug}.html"])
  defp sha_path(cache_dir, slug), do: Path.join([cache_dir, "html", "#{slug}.sha256"])
end
