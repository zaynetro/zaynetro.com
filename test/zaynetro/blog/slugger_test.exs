defmodule Zaynetro.Blog.SluggerTest do
  use ExUnit.Case, async: true
  alias Zaynetro.Blog.Slugger

  test "basic slugify" do
    {slug, _} = Slugger.slugify("Hello World")
    assert slug == "hello-world"
  end

  test "strips html tags" do
    {slug, _} = Slugger.slugify("Hello <code>World</code>")
    assert slug == "hello-world"
  end

  test "handles duplicates" do
    {slug1, seen1} = Slugger.slugify("Hello", %{})
    {slug2, _seen2} = Slugger.slugify("Hello", seen1)
    assert slug1 == "hello"
    assert slug2 == "hello-1"
  end

  test "trims leading/trailing dashes" do
    {slug, _} = Slugger.slugify("--hello--")
    assert slug == "hello"
  end
end
