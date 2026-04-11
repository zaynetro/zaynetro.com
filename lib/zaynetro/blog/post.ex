defmodule Zaynetro.Blog.Post do
  @moduledoc "A parsed and rendered blog post."

  @enforce_keys [:slug, :title, :date, :html, :toc, :draft, :has_mermaid, :has_labeled_img]
  defstruct [
    :slug,
    :title,
    :date,
    :html,
    :toc,
    :draft,
    :has_mermaid,
    :has_labeled_img,
    :description,
    :preview_image,
    :author
  ]

  @type t :: %__MODULE__{
          slug: String.t(),
          title: String.t(),
          date: Date.t(),
          html: String.t(),
          toc: list(),
          draft: boolean(),
          has_mermaid: boolean(),
          has_labeled_img: boolean(),
          description: String.t() | nil,
          preview_image: map() | nil,
          author: String.t() | nil
        }
end

defmodule Zaynetro.Blog.TocHeading do
  @moduledoc "A top-level H2 heading with optional nested H3 subheadings."

  @enforce_keys [:entry, :subheadings]
  defstruct [:entry, :subheadings]

  @type t :: %__MODULE__{
          entry: map(),
          subheadings: list()
        }
end

defmodule Zaynetro.Blog.TocEntry do
  @moduledoc "A single heading entry in the table of contents."

  @enforce_keys [:text, :slug]
  defstruct [:text, :slug]

  @type t :: %__MODULE__{
          text: String.t(),
          slug: String.t()
        }
end
