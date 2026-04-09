defmodule ZaynetroWeb.SudokuLive do
  use ZaynetroWeb, :live_view

  @exercises ~w(x-wing y-wing empty-rectangle)

  @impl true
  def mount(%{"exercise" => exercise}, _session, socket) do
    if exercise in @exercises do
      {:ok,
       socket
       |> assign(exercise: exercise)
       |> assign(extra_head: ~s(<script defer src="/assets/sudoku.js"></script>))}
    else
      {:ok, push_navigate(socket, to: "/sudoku")}
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <section class="max-w-2xl mx-auto px-4 py-8">
      <div id="sudoku-root" data-exercise={@exercise} phx-update="ignore">
        <p class="text-gray-500">Loading exercise...</p>
      </div>
    </section>
    """
  end
end
