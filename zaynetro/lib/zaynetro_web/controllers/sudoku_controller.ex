defmodule ZaynetroWeb.SudokuController do
  use ZaynetroWeb, :controller

  @exercises [
    %{slug: "x-wing", name: "Find an X-wing"},
    %{slug: "y-wing", name: "Find a Y-wing"},
    %{slug: "empty-rectangle", name: "Use Empty Rectangle technique"}
  ]

  @exercise_slugs Enum.map(@exercises, & &1.slug)
  @exercise_names Map.new(@exercises, &{&1.slug, &1.name})

  def index(conn, _params) do
    render(conn, :index, exercises: @exercises)
  end

  def show(conn, %{"exercise" => exercise}) when exercise in @exercise_slugs do
    conn
    |> assign(:page_title, @exercise_names[exercise])
    |> render(:show,
      exercise: exercise,
      extra_head: ~s(<script defer src="/assets/sudoku.js"></script>)
    )
  end

  def show(conn, _params) do
    redirect(conn, to: "/sudoku")
  end
end
