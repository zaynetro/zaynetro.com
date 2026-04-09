defmodule ZaynetroWeb.SudokuController do
  use ZaynetroWeb, :controller

  @exercises [
    %{slug: "x-wing", name: "Find an X-wing"},
    %{slug: "y-wing", name: "Find a Y-wing"},
    %{slug: "empty-rectangle", name: "Use Empty Rectangle technique"}
  ]

  def index(conn, _params) do
    render(conn, :index, exercises: @exercises)
  end
end
