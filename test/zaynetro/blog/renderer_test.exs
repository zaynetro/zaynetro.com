defmodule Zaynetro.Blog.RendererTest do
  use ExUnit.Case, async: true
  alias Zaynetro.Blog.Renderer

  test "renders basic markdown" do
    {:ok, result} = Renderer.render("# Hello\n\nWorld", "test-slug")
    assert result.html =~ "<h1"
    assert result.html =~ "Hello"
    assert result.html =~ "World"
  end

  test "extracts toc headings" do
    md = "## First\n\nContent\n\n## Second\n\nMore\n\n### Sub\n\nSub content"
    {:ok, result} = Renderer.render(md, "test")
    assert length(result.toc) == 2
    [first, second] = result.toc
    assert first.entry.text == "First"
    assert first.entry.slug == "first"
    assert second.entry.text == "Second"
    assert length(second.subheadings) == 1
  end

  test "detects mermaid blocks" do
    md = ~s(<mermaid-block name="test">\ngraph TD\n  A --> B\n</mermaid-block>)
    {:ok, result} = Renderer.render(md, "test")
    assert result.has_mermaid == true
    assert result.html =~ "mermaid-block"
  end

  test "transforms local images to picture elements" do
    md = "![My image](./my-image.png)"
    {:ok, result} = Renderer.render(md, "my-post")
    assert result.html =~ "<picture>"
    assert result.html =~ "/img?id=my-post%2Fmy-image.png"
  end

  test "does not transform external images" do
    md = "![External](https://example.com/img.png)"
    {:ok, result} = Renderer.render(md, "my-post")
    refute result.html =~ "<picture>"
    assert result.html =~ "https://example.com/img.png"
  end
end
