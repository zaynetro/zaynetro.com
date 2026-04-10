defmodule Zaynetro.Images.Queue do
  @moduledoc """
  Single-slot FIFO GenServer that serialises libvips resize calls.

  Semantic equivalent of the Deno semaphore: at most one ImageMagick/libvips
  operation runs at a time, preventing resource exhaustion.
  """

  use GenServer
  require Logger

  @call_timeout 30_000

  # ── Public API ─────────────────────────────────────────────────────────────

  @spec resize(String.t(), pos_integer(), String.t()) :: :ok | {:error, term()}
  def resize(path, width, out_path) do
    GenServer.call(__MODULE__, {:resize, path, width, out_path}, @call_timeout)
  end

  # ── GenServer ──────────────────────────────────────────────────────────────

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl GenServer
  def init(_opts), do: {:ok, %{}}

  @impl GenServer
  def handle_call({:resize, path, width, out_path}, _from, state) do
    result = do_resize(path, width, out_path)
    {:reply, result, state}
  end

  defp do_resize(path, width, out_path) do
    Logger.info("Resizing image #{path} to #{width}px")
    tmp = out_path <> ".tmp"
    File.mkdir_p!(Path.dirname(out_path))

    with {:ok, thumb} <- Image.thumbnail(path, width, fit: :contain),
         {:ok, _} <- Image.write(thumb, tmp) do
      File.rename(tmp, out_path)
    else
      {:error, reason} ->
        Logger.error("Image resize failed for #{path} at #{width}px: #{inspect(reason)}")
        {:error, reason}
    end
  end
end
