defmodule Zaynetro.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      ZaynetroWeb.Telemetry,
      {DNSCluster, query: Application.get_env(:zaynetro, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: Zaynetro.PubSub},
      # Blog.Cache must start before Images.Queue so posts are indexed first
      Zaynetro.Blog.Cache,
      Zaynetro.Images.Queue,
      ZaynetroWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Zaynetro.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    ZaynetroWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
