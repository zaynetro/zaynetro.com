defmodule Zaynetro.Blog.Slugger do
  @moduledoc """
  GitHub-compatible heading slug generator.

  Algorithm:
    1. Lowercase the text
    2. Strip all characters that are not alphanumeric or `-`
    3. Replace spaces with `-`
    4. Trim leading/trailing `-`
    5. Append `-N` suffix for duplicates (N starts at 1)
  """

  @doc """
  Generate a slug from a text string, tracking duplicates via the `seen` accumulator.

  Returns `{slug, updated_seen}`.

  ## Examples

      iex> Zaynetro.Blog.Slugger.slugify("Hello World", %{})
      {"hello-world", %{"hello-world" => 1}}

      iex> {_slug, seen} = Zaynetro.Blog.Slugger.slugify("Hello World", %{})
      iex> Zaynetro.Blog.Slugger.slugify("Hello World", seen)
      {"hello-world-1", %{"hello-world" => 2}}
  """
  @spec slugify(text :: String.t(), seen :: map()) :: {String.t(), map()}
  def slugify(text, seen \\ %{}) when is_binary(text) and is_map(seen) do
    base =
      text
      |> String.downcase()
      |> String.replace(~r/<[^>]+>/, "")
      |> String.replace(~r/[^a-z0-9\- ]/, "")
      |> String.replace(" ", "-")
      |> String.trim("-")

    count = Map.get(seen, base, 0)
    slug = if count == 0, do: base, else: "#{base}-#{count}"
    updated_seen = Map.put(seen, base, count + 1)
    {slug, updated_seen}
  end
end
