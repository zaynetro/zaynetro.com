defmodule ZaynetroWeb.Router do
  use ZaynetroWeb, :router

  pipeline :browser do
    plug(:accepts, ["html"])
    plug(:fetch_session)
    plug(:fetch_live_flash)
    plug(:put_root_layout, html: {ZaynetroWeb.Layouts, :root})
    plug(:put_layout, html: {ZaynetroWeb.Layouts, :app})
    plug(:protect_from_forgery)

    plug(:put_secure_browser_headers, %{
      "content-security-policy" =>
        "default-src 'self'; " <>
          "script-src 'self'; " <>
          "style-src 'self' 'unsafe-inline'; " <>
          "img-src 'self' data:; " <>
          "font-src 'self'; " <>
          "connect-src 'self' wss:; " <>
          "frame-ancestors 'none';"
    })
  end

  pipeline :api do
    plug(:accepts, ["json"])
  end

  # Image serving pipeline — no CSRF, no session, no layout
  pipeline :img do
    plug(:accepts, ["html", "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"])
  end

  scope "/", ZaynetroWeb do
    pipe_through(:browser)

    get("/", PageController, :index)
    get("/about", PageController, :about)
    get("/explainix", PageController, :explainix)
    get("/post/:slug", PostController, :show)
    get("/sudoku", SudokuController, :index)
    get("/sudoku/:exercise", SudokuController, :show)
    get("/feed.rss", FeedController, :index)
    get("/sitemap.xml", SitemapController, :index)
  end

  scope "/", ZaynetroWeb do
    pipe_through(:api)

    get("/healthz", HealthController, :check)
  end

  scope "/", ZaynetroWeb do
    pipe_through(:img)

    get("/img", ImgController, :show)
  end

  # Enable LiveDashboard in development
  if Application.compile_env(:zaynetro, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through(:browser)
      live_dashboard("/dashboard", metrics: ZaynetroWeb.Telemetry)
      get("/404", ZaynetroWeb.DevController, :not_found)
    end
  end
end
