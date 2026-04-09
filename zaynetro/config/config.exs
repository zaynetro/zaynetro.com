# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :zaynetro,
  generators: [timestamp_type: :utc_datetime]

# Configures the endpoint
config :zaynetro, ZaynetroWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [html: ZaynetroWeb.ErrorHTML, json: ZaynetroWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Zaynetro.PubSub,
  live_view: [signing_salt: "hjprrq9+"]

# Configure esbuild (the version is required)
config :esbuild,
  version: "0.25.4",
  zaynetro: [
    args:
      ~w(js/app.js --bundle --target=es2022 --outdir=../priv/static/assets/js
         --external:/fonts/* --external:/images/*
         --jsx=automatic --jsx-import-source=preact
         --loader:.js=jsx --loader:.tsx=tsx --loader:.ts=ts
         --alias:@=./js),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => [Path.expand("../assets/node_modules", __DIR__), Path.expand("../deps", __DIR__)]}
  ],
  sudoku: [
    args:
      ~w(js/islands/sudoku.jsx --bundle --target=es2022 --outfile=../priv/static/assets/sudoku.js
         --jsx=automatic --jsx-import-source=preact
         --loader:.tsx=tsx --loader:.ts=ts
         --alias:@=./js),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../assets/node_modules", __DIR__)}
  ],
  explainix: [
    args:
      ~w(js/islands/explainix.jsx --bundle --target=es2022 --outfile=../priv/static/assets/explainix.js
         --jsx=automatic --jsx-import-source=preact
         --loader:.tsx=tsx --loader:.ts=ts
         --alias:@=./js),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../assets/node_modules", __DIR__)}
  ]

# Configure tailwind (the version is required)
config :tailwind,
  version: "4.1.7",
  zaynetro: [
    args: ~w(
      --input=assets/css/app.css
      --output=priv/static/assets/css/app.css
    ),
    cd: Path.expand("..", __DIR__)
  ]

# Configures Elixir's Logger
config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
