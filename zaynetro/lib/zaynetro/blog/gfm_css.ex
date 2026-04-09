defmodule Zaynetro.Blog.GfmCss do
  @moduledoc """
  Inline CSS for blog post pages.

  Four blocks injected in order:
  1. GFM_VARS  — Lumis syntax-highlight CSS vars for light/dark themes
  2. GFM_CSS   — GitHub-flavoured Markdown prose rules
  3. GFM_CSS_CODE — Code block styles adapted for MDEx <pre class="lumis"> output
  4. GFM_CSS_CUSTOM — mermaid-block, labeled-img, img-block styles
  """

  lumis_light =
    File.read!(Path.join(__DIR__, "../../../deps/lumis/priv/static/css/github_light.css"))

  lumis_dark =
    File.read!(Path.join(__DIR__, "../../../deps/lumis/priv/static/css/github_dark.css"))

  @gfm_vars """
  @media (prefers-color-scheme: light) {
  #{lumis_light}
  }
  @media (prefers-color-scheme: dark) {
  #{lumis_dark}
  }
  """

  @gfm_css """
  .markdown-body { line-height: 1.6; word-wrap: break-word; }
  .markdown-body h1,.markdown-body h2,.markdown-body h3,
  .markdown-body h4,.markdown-body h5,.markdown-body h6 {
    margin-top: 1.5em; margin-bottom: .5em; font-weight: 600; line-height: 1.25;
  }
  .markdown-body h1 { font-size: 2em; border-bottom: 1px solid #d0d7de; padding-bottom: .3em; }
  .markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid #d0d7de; padding-bottom: .3em; }
  .markdown-body h3 { font-size: 1.25em; }
  .markdown-body p  { margin-top: 0; margin-bottom: 1em; }
  .markdown-body a  { color: inherit; text-decoration: underline dotted #777; text-decoration-thickness: from-font; padding: 1px 2px; border-radius: 5px; }
  .markdown-body a:hover { background-color: var(--a-hover-color); text-decoration: none; }
  .markdown-body blockquote {
    padding: 0 1em; color: #57606a;
    border-left: .25em solid #d0d7de; margin: 0 0 1em;
  }
  @media (prefers-color-scheme: dark) {
    .markdown-body h1, .markdown-body h2 { border-bottom-color: #3d444d; }
    .markdown-body blockquote { color: #c9d1d9; border-left-color: #3d444d; }
  }
  .markdown-body ul, .markdown-body ol { padding-left: 2em; margin-bottom: 1em; }
  .markdown-body ul { list-style-type: disc; }
  .markdown-body ul ul { list-style-type: circle; }
  .markdown-body ol { list-style-type: decimal; }
  .markdown-body li { margin-top: .25em; }
  .markdown-body table { border-collapse: collapse; margin-bottom: 1em; width: 100%; overflow: auto; }
  .markdown-body table th, .markdown-body table td {
    padding: 6px 13px; border: 1px solid #d0d7de;
  }
  .markdown-body table tr:nth-child(2n) { background-color: #f6f8fa; }
  @media (prefers-color-scheme: dark) {
    .markdown-body table th, .markdown-body table td { border-color: #3d444d; }
    .markdown-body table tr:nth-child(2n) { background-color: #1c2128; }
  }
  .markdown-body hr { border: 0; border-top: 1px solid #d0d7de; margin: 1.5em 0; }
  @media (prefers-color-scheme: dark) { .markdown-body hr { border-top-color: #3d444d; } }
  .markdown-body img { max-width: 100%; }
  .markdown-body picture { display: block; }
  .markdown-body code:not(pre code) {
    background-color: rgba(175,184,193,.2);
    border-radius: 6px; font-size: .875em;
    padding: .2em .4em; font-family: ui-monospace, SFMono-Regular, monospace;
  }
  @media (prefers-color-scheme: dark) {
    .markdown-body code:not(pre code) { background-color: rgba(110,118,129,.4); }
  }
  """

  @gfm_css_code """
  .markdown-body pre.lumis {
    border-radius: 6px; overflow: auto; padding: 1em;
    font-size: .875em; line-height: 1.45;
    margin-bottom: 1em;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  .markdown-body pre.lumis code { background: none; padding: 0; font-size: inherit; }
  """

  @gfm_css_custom """
  .markdown-body .mermaid-block { margin: 1.5em 0; overflow-x: auto; }
  .markdown-body .mermaid-block pre.mermaid { background: transparent; padding: 0; margin: 0; }
  .markdown-body .img-block { margin: 1.5em 0; }
  .markdown-body .img-block img { max-width: 100%; border-radius: 4px; }
  .markdown-body .img-block-label {
    font-size: .875em; color: #57606a; margin-top: .25em;
    text-align: center; font-style: italic;
  }
  @media (prefers-color-scheme: dark) {
    .markdown-body .img-block-label { color: #8b949e; }
  }
  """

  @doc "Returns all four CSS blocks concatenated, ready for inline injection."
  @spec all() :: String.t()
  def all, do: @gfm_vars <> @gfm_css <> @gfm_css_code <> @gfm_css_custom

  @doc "Syntax-highlight theme CSS (GFM_VARS)."
  @spec vars() :: String.t()
  def vars, do: @gfm_vars

  @doc "Prose rules CSS (GFM_CSS)."
  @spec prose() :: String.t()
  def prose, do: @gfm_css

  @doc "Code block CSS (GFM_CSS_CODE)."
  @spec code() :: String.t()
  def code, do: @gfm_css_code

  @doc "Custom element CSS (GFM_CSS_CUSTOM)."
  @spec custom() :: String.t()
  def custom, do: @gfm_css_custom
end
