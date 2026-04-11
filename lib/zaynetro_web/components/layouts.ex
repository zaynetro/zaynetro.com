defmodule ZaynetroWeb.Layouts do
  @moduledoc "Site layouts: root shell, header, footer."
  use ZaynetroWeb, :html
  # Override CoreComponents.header/1 with our site header
  import ZaynetroWeb.CoreComponents, except: [header: 1]

  embed_templates "layouts/*"

  @doc "Site header with nav."
  def site_header(assigns) do
    ~H"""
    <header class="max-w-3xl mx-auto pt-10 pb-6 px-4">
      <nav class="flex gap-4 flex-wrap sm:flex-nowrap justify-between items-center">
        <a href="/" class="text-lg no-underline">zaynetro.com</a>

        <div class="flex gap-4">
          <a href="/" class="text-lg no-underline py-1.5 sm:py-0 px-2">Blog</a>
          <a href="/about" class="text-lg no-underline py-1.5 sm:py-0 px-2">About</a>
        </div>

        <ul class="flex gap-2 text-lg list-none p-0 m-0">
          <li>
            <a href="/sudoku" class="flex items-center gap-1 no-underline py-1.5 sm:py-0 px-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="5" cy="5" r="1" /><circle cx="12" cy="5" r="1" />
                <circle cx="19" cy="5" r="1" /><circle cx="5" cy="12" r="1" />
                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="19" r="1" /><circle cx="12" cy="19" r="1" />
                <circle cx="19" cy="19" r="1" />
              </svg>
              Sudoku
            </a>
          </li>
        </ul>
      </nav>
    </header>
    """
  end

  @doc "Site footer."
  def footer(assigns) do
    ~H"""
    <footer class="text-center mt-8 mb-4 px-4">
      <div class="inline-flex flex-col sm:flex-row text-gray-700 dark:text-gray-200 text-sm gap-4">
        <span>Roman Zaynetdinov (zaynetro) {Date.utc_today().year}</span>
        <span class="hidden sm:block text-gray-300">|</span>

        <div class="flex gap-4 justify-center">
          <span>
            <a href="https://github.com/zaynetro/zaynetro.com" class="py-1.5 sm:py-0">Source</a>
          </span>
          <span class="text-gray-300">|</span>
          <span>
            <a href="mailto:roman@zaynetro.com" class="py-1.5 sm:py-0">Get in touch</a>
          </span>
        </div>
      </div>
    </footer>
    """
  end

  attr :flash, :map, required: true
  attr :id, :string, default: "flash-group"

  def flash_group(assigns) do
    ~H"""
    <div id={@id} aria-live="polite">
      <.flash kind={:info} flash={@flash} />
      <.flash kind={:error} flash={@flash} />
    </div>
    """
  end
end
