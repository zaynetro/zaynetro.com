defmodule ZaynetroWeb.CoreComponents do
  @moduledoc """
  Provides core UI components.

  Styled with plain Tailwind CSS utility classes. See:

    * [Tailwind CSS](https://tailwindcss.com)
    * [Heroicons](https://heroicons.com) - see `icon/1` for usage.
    * [Phoenix.Component](https://hexdocs.pm/phoenix_live_view/Phoenix.Component.html) -
      the component system used by Phoenix. Some components, such as `<.link>`
      and `<.form>`, are defined there.

  """
  use Phoenix.Component
  use Gettext, backend: ZaynetroWeb.Gettext

  alias Phoenix.LiveView.JS

  @doc """
  Renders flash notices.

  ## Examples

      <.flash kind={:info} flash={@flash} />
      <.flash kind={:info} phx-mounted={show("#flash")}>Welcome Back!</.flash>
  """
  attr :id, :string, doc: "the optional id of flash container"
  attr :flash, :map, default: %{}, doc: "the map of flash messages to display"
  attr :title, :string, default: nil
  attr :kind, :atom, values: [:info, :error], doc: "used for styling and flash lookup"
  attr :rest, :global, doc: "the arbitrary HTML attributes to add to the flash container"

  slot :inner_block, doc: "the optional inner block that renders the flash message"

  def flash(assigns) do
    assigns = assign_new(assigns, :id, fn -> "flash-#{assigns.kind}" end)

    ~H"""
    <div
      :if={msg = render_slot(@inner_block) || Phoenix.Flash.get(@flash, @kind)}
      id={@id}
      phx-click={JS.push("lv:clear-flash", value: %{key: @kind}) |> hide("##{@id}")}
      role="alert"
      class={[
        "fixed top-4 right-4 z-50 flex items-start gap-3",
        "w-80 sm:w-96 rounded-lg p-4 shadow-lg text-sm ring-1",
        @kind == :info &&
          "bg-blue-50 text-blue-900 ring-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:ring-blue-800",
        @kind == :error &&
          "bg-red-50 text-red-900 ring-red-200 dark:bg-red-950 dark:text-red-100 dark:ring-red-800"
      ]}
      {@rest}
    >
      <.icon :if={@kind == :info} name="hero-information-circle" class="size-5 shrink-0 mt-0.5" />
      <.icon :if={@kind == :error} name="hero-exclamation-circle" class="size-5 shrink-0 mt-0.5" />
      <div class="flex-1 min-w-0 break-words">
        <p :if={@title} class="font-semibold mb-0.5">{@title}</p>
        <p>{msg}</p>
      </div>
      <button type="button" class="group shrink-0 cursor-pointer" aria-label={gettext("close")}>
        <.icon name="hero-x-mark" class="size-5 opacity-40 group-hover:opacity-70" />
      </button>
    </div>
    """
  end

  @doc """
  Renders a [Heroicon](https://heroicons.com).

  Heroicons come in three styles – outline, solid, and mini.
  By default, the outline style is used, but solid and mini may
  be applied by using the `-solid` and `-mini` suffix.

  You can customize the size and colors of the icons by setting
  width, height, and background color classes.

  Icons are extracted from the `deps/heroicons` directory and bundled within
  your compiled app.css by the plugin in `assets/vendor/heroicons.js`.

  ## Examples

      <.icon name="hero-x-mark" />
      <.icon name="hero-arrow-path" class="ml-1 size-3 motion-safe:animate-spin" />
  """
  attr :name, :string, required: true
  attr :class, :string, default: "size-4"

  def icon(%{name: "hero-" <> _} = assigns) do
    ~H"""
    <span class={[@name, @class]} />
    """
  end

  ## JS Commands

  def show(js \\ %JS{}, selector) do
    JS.show(js,
      to: selector,
      time: 300,
      transition:
        {"transition-all ease-out duration-300",
         "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95",
         "opacity-100 translate-y-0 sm:scale-100"}
    )
  end

  def hide(js \\ %JS{}, selector) do
    JS.hide(js,
      to: selector,
      time: 200,
      transition:
        {"transition-all ease-in duration-200", "opacity-100 translate-y-0 sm:scale-100",
         "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"}
    )
  end

  @doc """
  Translates an error message using gettext.
  """
  def translate_error({msg, opts}) do
    if count = opts[:count] do
      Gettext.dngettext(ZaynetroWeb.Gettext, "errors", msg, msg, count, opts)
    else
      Gettext.dgettext(ZaynetroWeb.Gettext, "errors", msg, opts)
    end
  end
end
