# Tasks: zaynetro.com — Deno/Fresh → Elixir/Phoenix Rewrite

**Input**: Design documents from `/specs/001-document-site-design/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/routes.md ✅ | quickstart.md ✅

**Stack**: Elixir 1.19 / OTP 28 · Phoenix 1.7 · LiveView 0.20 · MDEx ~>0.12 · image ~>0.54 · toml ~>0.7 · Tailwind 3 · esbuild · Preact · Bandit

**Project root**: `zaynetro/` (bootstrapped with `mix phx.new zaynetro --no-ecto --no-mailer` from current repo root)

**Tests**: Included for domain logic (Slugger, Renderer) and HTTP integration per the plan's testing strategy. Not using TDD; tests written after implementation to verify correctness.

---

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Parallelisable — operates on different files, no unresolved dependencies
- **[US1/2/3]**: Maps to spec.md user story
- Paths are relative to the Phoenix project root (`zaynetro/`)

---

## Phase 1: Setup

**Purpose**: Bootstrap the Phoenix project, configure all build tools, migrate static content and JS island sources from the current Deno repo.

- [X] T001 Bootstrap Phoenix project: run `mix phx.new zaynetro --no-ecto --no-mailer` (Elixir 1.19 / OTP 28) in repo root, producing `zaynetro/` directory
- [X] T002 Add domain hex dependencies to `mix.exs` deps list: `{:mdex, "~> 0.12"}`, `{:image, "~> 0.54"}`, `{:toml, "~> 0.7"}`, `{:bandit, "~> 1.0"}`; run `mix deps.get`
- [X] T003 [P] Configure all three esbuild profiles in `config/config.exs`: `default` (entry `js/app.js` → `assets/app.js`), `sudoku` (entry `js/islands/sudoku.jsx` → `assets/sudoku.js`), `explainix` (entry `js/islands/explainix.jsx` → `assets/explainix.js`); configure `tailwind` profile pointing at `assets/tailwind.config.js`
- [X] T004 [P] Configure dev-server watchers in `config/dev.exs` for all three esbuild profiles and the tailwind watcher so all assets rebuild on file change
- [X] T005 [P] Configure `config/prod.exs` with `config :zaynetro, hide_drafts: true`; configure `config/test.exs` with `config :zaynetro, posts_dir: "test/fixtures/posts"` and silent logging
- [X] T006 Configure `config/runtime.exs` with `PHX_HOST`, `SECRET_KEY_BASE`, `PORT` (default 4000), `IMAGE_CACHE_DIR` (default `/data/cache/images`), `POSTS_DIR` (default `posts/` relative to CWD) from environment variables
- [X] T007 [P] Configure `assets/package.json` with dependencies `preact`, `@preact/signals`, `marked`; run `npm install`; configure `assets/tailwind.config.js` with content paths covering `lib/zaynetro_web/**/*.{ex,heex}` and `assets/js/**/*.{js,jsx}`, and the `heartbeat` keyframe animation
- [X] T008 Copy static content from current Deno repo into Phoenix project: `../posts/` → `posts/`, `../static/images/` → `priv/static/images/`, `../static/favicon.png` → `priv/static/favicon.png`, `../static/bundler-demo/` → `priv/static/bundler-demo/`
- [X] T009 Migrate JS island sources from current Deno repo: convert TSX → JSX (strip TypeScript annotations, preserve all logic); copy `../islands/sudoku/SudokuXWing.tsx` → `assets/js/components/sudoku/SudokuXWing.jsx`, `SudokuYWing.jsx`, `SudokuEmptyRectangle.jsx`; copy `../components/SudokuExercise.tsx` → `assets/js/components/SudokuExercise.jsx`, `SudokuPuzzle.tsx` → `SudokuPuzzle.jsx`; copy `../components/nix/` → `assets/js/components/nix/`

**Checkpoint**: Phoenix project exists, `mix deps.get` passes, `mix compile` passes, all content assets are in place.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core OTP + data-layer infrastructure that MUST be complete before any user-visible page can be implemented. Includes the full blog loading pipeline, image pipeline, shared web infrastructure (layouts, router, plugs), and the image/health controllers.

**⚠️ CRITICAL**: No user-story phase can begin until this phase is complete.

### Domain Layer

- [X] T010 Define `%BlogPost{}`, `%BlogPost.PreviewImage{}`, `%TocHeading{}`, `%TocEntry{}` structs with `@enforce_keys`, `@type` specs, and `@moduledoc` exactly as specified in `data-model.md` in `lib/zaynetro/blog/post.ex`
- [X] T011 [P] Implement `Zaynetro.Blog.Slugger` with `slugify/2` spec: lowercase → strip non-alphanumeric (keep `-`) → replace spaces with `-` → trim leading/trailing `-` → append `-N` suffix for duplicates (N starts at 1); matches `github-slugger` algorithm in `lib/zaynetro/blog/slugger.ex`
- [X] T012 Implement `Zaynetro.Blog.Renderer` with MDEx pipeline: (1) `MDEx.parse_document(markdown, mdex_opts)` → AST; (2) `MDEx.traverse_and_update/2` accumulating `{toc, has_mermaid, has_labeled_img}` — transform `HtmlBlock` with `mermaid-block` → `<section class="mermaid-block">`, `labeled-img` → `<section class="img-block">`, collect H2/H3 into TOC via `Slugger.slugify/2`, replace `Image` nodes with `<picture>` + srcset HTML for local images; (3) `MDEx.to_html!` → final HTML; return `{:ok, %{html, toc, has_mermaid, has_labeled_img}}` in `lib/zaynetro/blog/renderer.ex`
- [X] T013 [P] Implement `Zaynetro.Blog.DiskCache` for rendered post HTML: `get/2` reads `{CACHE_DIR}/html/{slug}.html` and `{slug}.sha256`; `put/3` writes both files; cache miss or stale SHA-256 returns `:miss`; used by Loader to skip re-render on restart in `lib/zaynetro/blog/disk_cache.ex`
- [X] T014 Implement `Zaynetro.Blog.Loader` with `load_all/1` (walks `posts/` directory, handles both `{slug}/index.md` and `{slug}.md` patterns) and `load_file/2` (splits on `+++` to extract TOML frontmatter, `Toml.decode/1`, validates required `title`/`date` fields raising `ArgumentError` on missing, calls `Renderer.render/2` or DiskCache, builds `%BlogPost{}` struct, registers image paths including preview_image); `load_all/1` also registers static images `logo.jpg` and `bolik-timeline-logo.png` from `priv/static/images/` in `lib/zaynetro/blog/loader.ex`
- [X] T015 Implement `Zaynetro.Blog.Cache` as a `GenServer` that creates `:blog_posts` (`:set, :public, :named_table`) and `:blog_images` ETS tables on `init/1`, calls `Loader.load_all/1`, inserts `{slug, %BlogPost{}}` tuples; public API: `get_post/1` → `{:ok, post} | {:error, :not_found}`, `list_published_posts/0` → sorted newest-first (hides drafts when `Application.get_env(:zaynetro, :hide_drafts)`), `image_path/1` → `{:ok, path} | {:error, :not_found}` in `lib/zaynetro/blog/cache.ex`
- [X] T016 [P] Implement `Zaynetro.Images.DiskCache` with `get/2` (check `{CACHE_DIR}/{slug}/{file}_{w}w.png` exists → return `{:ok, bytes}`), `put/3` (atomic write via temp file + `File.rename/2`), and `cache_path/3` helper in `lib/zaynetro/images/disk_cache.ex`
- [X] T017 Implement `Zaynetro.Images.Queue` as a named `GenServer` serialising libvips resize calls to a single slot: `handle_call({:resize, path, width}, from, state)` calls `Image.open/1`, `Image.thumbnail/3`, `Image.write(:memory)`, replies with `{:ok, bytes} | {:error, reason}`; 30_000 ms call timeout in `lib/zaynetro/images/queue.ex`
- [X] T018 Implement `Zaynetro.Images.Pipeline` public API: `resize_and_cache/2` (DiskCache.get → hit: return bytes; miss: Cache.image_path → Queue resize → DiskCache.put → return bytes); `serve_original/1` (Cache.image_path → File.read + MIME type detection) in `lib/zaynetro/images/pipeline.ex`
- [X] T019 Configure `lib/zaynetro/application.ex` OTP supervisor children to include `Zaynetro.Blog.Cache` and `Zaynetro.Images.Queue` (in that order, so Cache is ready before Queue starts accepting image resize requests)

### Web Infrastructure

- [X] T020 [P] Implement `ZaynetroWeb.GfmCss` with `post_head_styles/0` returning `{:safe, html}` — four inline `<style>` blocks in order: `GFM_VARS` (CSS custom properties for MDEx Lumis `light-dark()` syntax highlight tokens for `github_light`/`github_dark`), `GFM_CSS` (prose/typography rules), `GFM_CSS_CODE` (adapted for MDEx `<pre>` output rather than Prism's `<div class="highlight">`), `GFM_CSS_CUSTOM` (mermaid-block, labeled-img, img-block styles) in `lib/zaynetro_web/gfm_css.ex`
- [X] T021 Implement root layout HEEx shell: `<html lang="en">`, `<meta name="viewport">`, conditional `<title>` (bare site name when `@page_title` nil), `<meta name="description">` when `@meta_description` set, favicon link, `<link>` to Tailwind CSS bundle, `{:safe, @post_styles}` injection point in `<head>`, `<body class="...">` wrapper in `lib/zaynetro_web/components/layouts/root.html.heex`
- [X] T022 Implement app layout HEEx: renders `<.header />`, `<main>` wrapping `@inner_content`, `<.footer />`, and `<%= render_extra_scripts(@extra_scripts) %>` before `</body>` in `lib/zaynetro_web/components/layouts/app.html.heex`
- [X] T023 Implement `header/1` function component (nav bar: site title "Roman Zaynetdinov (zaynetro)" linking to `/`, nav links for Posts (`/`) and About (`/about`)) and `footer/1` component with "Made by Roman" text and links in `lib/zaynetro_web/components/layouts.ex`
- [X] T024 Configure `lib/zaynetro_web/router.ex` with all routes from `contracts/routes.md`: `GET /` → `PageController.index`, `GET /about` → `PageController.about`, `GET /explainix` → `PageController.explainix`, `GET /post/:slug` → `PostController.show`, `GET /sudoku` → `SudokuController.index`, `GET /sudoku/:exercise` → `SudokuLive` (live route), `GET /img` → `ImgController.show`, `GET /feed.rss` → `FeedController.index`, `GET /sitemap.xml` → `SitemapController.index`, `GET /healthz` → `HealthController.check`; no analytics proxy routes
- [X] T025 Implement `ZaynetroWeb.TypescriptStaticPlug` as a `Plug` matching `GET /bundler-demo/*.ts`, reading file from `priv/static/bundler-demo/`, sending with `Content-Type: application/typescript`; 404 if file not found in `lib/zaynetro_web/plugs/typescript_static_plug.ex`
- [X] T026 Configure `lib/zaynetro_web/endpoint.ex` to insert `TypescriptStaticPlug` before `Plug.Static` in the plug pipeline; ensure `Plug.Static` serves `priv/static/` with correct paths
- [X] T027 Implement `ZaynetroWeb.ImgController.show/2`: validate query params per `data-model.md` rules (`id` missing → 500 "id is missing"; neither `w` nor `orig` → 500 "w or orig params are missing"; unknown `id` → 404 "img not found"; unparseable `w` → 400 "invalid width"); call `Pipeline.serve_original/1` or `Pipeline.resize_and_cache/2`; set `Cache-Control: public, max-age=31536000, immutable` when `v` param present in `lib/zaynetro_web/controllers/img_controller.ex`
- [X] T028 [P] Implement `ZaynetroWeb.HealthController.check/2` returning `200 application/json` body `{"status":"ok"}` in `lib/zaynetro_web/controllers/health_controller.ex`

**Checkpoint**: `mix compile --warnings-as-errors` passes. Application starts: `Blog.Cache` loads all posts into ETS, `Images.Queue` is registered. `GET /healthz` returns `{"status":"ok"}`. `GET /img?id=logo.jpg&w=200` returns a resized PNG.

---

## Phase 3: User Story 1 — Read Blog Posts (Priority: P1) 🎯 MVP

**Goal**: A visitor can load the home page, browse the post list, click a post, and read content with syntax-highlighted code blocks, a sticky TOC, responsive images, and Mermaid diagrams (lazy-loaded client-side). Dark mode works throughout.

**Independent Test**: Navigate to `/`, click any post, verify HTML content renders, code blocks are syntax-highlighted (no JavaScript required), all post images load responsively. Open `/feed.rss` and verify it is valid RSS 2.0 XML.

- [X] T029 [P] [US1] Implement `ZaynetroWeb.PageController.index/2` (assign `posts: Blog.Cache.list_published_posts()` sorted newest-first, `page_title: nil`, `meta_description: "Welcome to my personal blog! ..."`) and `PageController.about/2` (assign `page_title: nil`, same meta_description) in `lib/zaynetro_web/controllers/page_controller.ex`
- [X] T030 [P] [US1] Create `ZaynetroWeb.PageHTML` module with `embed_templates "page_html"` in `lib/zaynetro_web/controllers/page_html.ex`
- [X] T031 [US1] Implement home page template: `<section class="max-w-3xl mx-auto flex flex-col gap-8 px-2">`, each post as `<article class="flex gap-4">` with `<.preview_image>` component (srcset 48/96w mobile, 64/128w desktop via `/img?id=...&w=N`) + post title/date link in `lib/zaynetro_web/controllers/page_html/index.html.heex`
- [X] T032 [US1] Implement about page template: profile photo as `<picture>` element with `<source>` srcset `"/img?id=logo.jpg&w=200 1x, /img?id=logo.jpg&w=400 2x"` and `<img src="/img?id=logo.jpg&w=200">`; about content paragraphs in `lib/zaynetro_web/controllers/page_html/about.html.heex`
- [X] T033 [P] [US1] Implement `ZaynetroWeb.PostController.show/2`: call `Blog.Cache.get_post(slug)`, on `{:ok, post}` assign `post`, `page_title: post.title`, `meta_description: post.description`, `post_styles: GfmCss.post_head_styles()`; on `{:error, :not_found}` assign `page_title: "Not found"` and render not-found view (HTTP 200, matching Deno behaviour) in `lib/zaynetro_web/controllers/post_controller.ex`
- [X] T034 [P] [US1] Create `ZaynetroWeb.PostHTML` module with `embed_templates "post_html"` in `lib/zaynetro_web/controllers/post_html.ex`
- [X] T035 [US1] Implement post show template: three-column flex layout (`<div class="flex gap-4">`); left: `<.post_toc toc={@post.toc} />` (sticky, desktop only); centre: `<div class="markdown-body"><%= raw(@post.html) %></div>` with LikeButton `<button data-like-button data-slug={@post.slug}>`; right: spacer div; not-found branch renders `<h1>Not found</h1>` in `lib/zaynetro_web/controllers/post_html/show.html.heex`
- [X] T036 [US1] Implement `post_toc/1` function component (renders `<nav>` with H2 links each with optional nested H3 sub-links, sticky `top-4` positioning) and `preview_image/1` component (renders `<picture>` with mobile/desktop `<source>` srcsets using standard home-page breakpoints 48/96/64/128w) in `lib/zaynetro_web/components/blog_components.ex`
- [X] T037 [US1] Implement `assets/css/app.css`: `@tailwind base/components/utilities`; migrate CSS custom properties from `static/styles.css` (`:root` light defaults: `--text-color: #333`, `--bg-color: #fff`, `--a-hover-color: #ffe69c`; `@media (prefers-color-scheme: dark)`: `--text-color: #f1f1f1`, `--bg-color: #111`); global link hover style using `var(--a-hover-color)`; prose max-width `65ch` for `.markdown-body`
- [X] T038 [US1] Implement `assets/js/app.js`: on `DOMContentLoaded`, if `document.querySelector(".mermaid-block")` exists then `import("mermaid").then(m => m.default.initialize({startOnLoad:true}))` (dynamic import, never bundled); LikeButton init — query `[data-like-button]`, read/write clicked state from `localStorage` keyed by `data-slug`; file loaded with `defer` from root layout
- [X] T039 [US1] Implement `ZaynetroWeb.FeedController.index/2` (assign `posts: Blog.Cache.list_published_posts()`, set `Content-Type: text/xml; charset=utf-8`) and RSS 2.0 XML template with `<rss version="2.0" xmlns:atom="..." xmlns:content="...">`, `<atom:link>` self-reference, per-post `<item>` with `<guid isPermaLink="false">`, `<pubDate>` in RFC 2822 UTC format, `<content:encoded><![CDATA[{post.html}]]></content:encoded>` in `lib/zaynetro_web/controllers/feed_controller.ex` and `lib/zaynetro_web/controllers/feed_html/index.xml.heex`
- [X] T040 [US1] Implement `ZaynetroWeb.SitemapController.index/2` (assign published posts, set `Content-Type: text/xml`) and XML sitemap template including URLs: `/`, each `/post/{slug}`, `/sudoku`, `/sudoku/x-wing`, `/sudoku/y-wing`, `/sudoku/empty-rectangle` in `lib/zaynetro_web/controllers/sitemap_controller.ex` and `lib/zaynetro_web/controllers/sitemap_html/index.xml.heex`

**Checkpoint**: US1 fully functional. `GET /` lists posts. `GET /post/{any-slug}` renders full HTML with highlighted code, sticky TOC, responsive images, LikeButton. `GET /feed.rss` is valid RSS. No JavaScript required to read post content. Dark mode verified.

---

## Phase 4: User Story 2 — Explainix (Priority: P2)

**Goal**: A visitor can load `/explainix`, click a Nix construct, see a tooltip with syntax-highlighted code, and close it with Escape.

**Independent Test**: Load `/explainix`, click a Nix element, verify tooltip appears with correct content and closes on Escape. Verify page renders without JavaScript (empty root div visible, no JS errors).

- [X] T041 [P] [US2] Implement `ZaynetroWeb.PageController.explainix/2` action: assign `page_title: "Explainix"`, `meta_description: "Explain Nix syntax visually"`, `post_styles: GfmCss.post_head_styles()`, `extra_scripts: [{:safe, "<script defer src=\"/assets/explainix.js\"></script>"}]` in `lib/zaynetro_web/controllers/page_controller.ex`
- [X] T042 [US2] Implement explainix page template: `<div id="explainix-root"></div>` (Preact mount target) + `<div class="h-80"></div>` spacer for tooltip popup clearance in `lib/zaynetro_web/controllers/page_html/explainix.html.heex`
- [X] T043 [US2] Create explainix Preact island entry point: import `ExplainixApp` (or equivalent root component) from migrated nix components in `assets/js/components/nix/`; call `render(<ExplainixApp />, document.getElementById("explainix-root"))`; remove any `plausible(...)` analytics calls in `assets/js/islands/explainix.jsx`

**Checkpoint**: US2 functional independently. `/explainix` renders SSR shell without JS. With JS enabled, Preact island mounts and Nix tooltip interaction works.

---

## Phase 5: User Story 3 — Sudoku Exercises (Priority: P3)

**Goal**: A visitor can browse Sudoku exercises at `/sudoku`, select one, interact with the 9×9 grid (cell selection, notes mode, hints, candidate auto-fill, keyboard input), and see congratulations on completion.

**Independent Test**: Load `/sudoku/x-wing`, interact with puzzle grid, trigger a hint, verify hint text and cell highlight appear. Verify unknown slug `/sudoku/bogus` redirects to `/sudoku`.

- [X] T044 [P] [US3] Implement `ZaynetroWeb.SudokuController.index/2`: assign `exercises: @exercises` (the three `%{slug, name}` maps), `page_title: "Sudoku"`, `meta_description: "Practice solving Sudoku online..."` in `lib/zaynetro_web/controllers/sudoku_controller.ex`
- [X] T045 [P] [US3] Implement sudoku index template: `<ul>` of exercise links `<li><a href="/sudoku/{ex.slug}">{ex.name}</a></li>` in `lib/zaynetro_web/controllers/sudoku_html/index.html.heex`
- [X] T046 [US3] Implement `ZaynetroWeb.SudokuLive` LiveView: define `@exercises` module attribute; `mount/3` checks `params["exercise"]` — if not in `@exercises` call `push_navigate(socket, to: "/sudoku")`; if valid assign `exercise: slug`, `name: exercise_name`, `page_title: exercise_name`, `extra_scripts: [{:safe, "<script defer src=\"/assets/sudoku.js\"></script>"}]` in `lib/zaynetro_web/live/sudoku_live.ex`
- [X] T047 [US3] Implement SudokuLive HEEx template: `<style>body { touch-action: pan-x pan-y; }</style>` inline (prevents iOS Safari pinch-zoom on the puzzle); `<div id="sudoku-root" data-exercise={@exercise} phx-update="ignore"></div>` (Preact mount target, LiveView ignores DOM inside) in `lib/zaynetro_web/live/sudoku_live.html.heex`
- [X] T048 [US3] Create sudoku Preact island entry point: read `document.getElementById("sudoku-root").dataset.exercise` to determine which exercise to render; import and render the correct component (`SudokuXWing`, `SudokuYWing`, or `SudokuEmptyRectangle`) from `assets/js/components/sudoku/`; remove all `plausible(...)` analytics calls from migrated components in `assets/js/islands/sudoku.jsx`

**Checkpoint**: US3 functional independently. `/sudoku` lists exercises. `/sudoku/x-wing` renders LiveView shell SSR. With JS, Preact Sudoku island mounts and full puzzle interaction works. `/sudoku/unknown` redirects to `/sudoku`.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Deployment configuration, quality gates, backward-compatibility verification.

- [X] T049 [P] Write multi-stage `Dockerfile`: builder stage (Debian `bookworm`, Elixir 1.19/OTP 28, `libvips-dev`, Node 24, `mix deps.get`, `mix assets.deploy`, `mix release`); runner stage (`debian:bookworm-slim`, `libvips42`, copy release from builder, set `LANG=C.UTF-8 PHX_SERVER=true`, `CMD ["/app/bin/zaynetro", "start"]`) in `Dockerfile` (at Phoenix project root `zaynetro/`)
- [X] T050 [P] Write `fly.toml`: app name `zaynetro`, primary region `ams`, `[[mounts]]` source `zaynetro_image_cache` mounted at `/data/cache/images`, `[[vm]]` size `shared-cpu-1x`, `[env]` with `PHX_HOST`, `PORT=8080` in `fly.toml` (at Phoenix project root `zaynetro/`)
- [X] T051 [P] Write unit tests for `Zaynetro.Blog.Slugger`: basic slug, multi-word with spaces, punctuation stripping, trailing dash trim, duplicate suffix (`-1`, `-2`), empty string in `test/zaynetro/blog/slugger_test.exs`
- [X] T052 [P] Write unit tests for `Zaynetro.Blog.Renderer`: `<mermaid-block>` → `<section class="mermaid-block">` sets `has_mermaid: true`; `<labeled-img>` → `<section class="img-block">` sets `has_labeled_img: true`; `has_mermaid` and `has_labeled_img` are INDEPENDENT (bug-fix from Deno); H2/H3 TOC extraction; local `Image` node → `<picture>` with srcset in `test/zaynetro/blog/renderer_test.exs`
- [X] T053 Write HTTP integration tests using `Phoenix.ConnTest`: `GET /` returns 200 HTML with post titles; `GET /post/hello-world` returns 200 with `.markdown-body`; `GET /post/nonexistent` returns 200 with "Not found"; `GET /img` with missing `id` returns 500; `GET /feed.rss` returns valid XML with `<rss`; `GET /healthz` returns `{"status":"ok"}` in `test/zaynetro_web/controllers/`
- [X] T054 [P] Write `ZaynetroWeb.SudokuLiveTest`: unknown exercise slug pushes navigate to `/sudoku`; known slug assigns correct `exercise` and `name`; rendered HTML contains `id="sudoku-root"` with correct `data-exercise` in `test/zaynetro_web/live/sudoku_live_test.exs`
- [X] T055 Run `mix compile --warnings-as-errors` and fix any warnings; run `mix format --check-formatted`; run `mix test` (all tests pass); manually verify: oldest post in `posts/` renders correctly, ≥ 3 posts with code blocks render with syntax highlighting, ≥ 1 post with `<mermaid-block>` has Mermaid rendered client-side (JS enabled), dark mode colour scheme correct on all pages, all `<script>` tags have `defer`, all images are wrapped in `<picture>` + srcset, `docker build` succeeds, `GET /img?id=what-is-deno/deno_hr_small.png&w=900` returns PNG

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
  └── Phase 2 (Foundational) — BLOCKS all user stories
        ├── Phase 3 (US1) ─────────────────────────────┐
        ├── Phase 4 (US2)  ← independent of US1/US3   ├── Phase 6 (Polish)
        └── Phase 5 (US3)  ← independent of US1/US2   ┘
```

### User Story Dependencies

| Story | Depends On | Depends on Another Story? |
|---|---|---|
| US1 — Read Blog Posts | Phase 2 complete | No |
| US2 — Explainix | Phase 2 complete (needs GfmCss, layouts, router) | No |
| US3 — Sudoku Exercises | Phase 2 complete (needs LiveView router) | No |

### Within Each Phase

- **Phase 1**: T001 → T002 → then T003–T010 can run in parallel
- **Phase 2 domain layer**: T010 → T011 → T012 (uses Slugger) → T013, T014 (in parallel) → T015 (needs Loader + DiskCache); T016–T018 can start after T010; T019 needs T015 + T018
- **Phase 2 web infra**: T020–T025 can run in parallel after T002; T026 needs T025; T027 needs T018 (Pipeline); T028 independent
- **Phase 3**: T029–T030 in parallel; T031 needs T029+T030; T032 needs T029+T030; T033–T034 in parallel; T035 needs T033+T034; T036 needs T029; T037–T040 in parallel after T033

### Parallel Opportunities Within User Stories

```bash
# Phase 2 domain layer — start together after T010:
Slugger (T011) | DiskCache Blog (T013)

# Phase 2 web infra — start together after T002:
GfmCss (T020) | root layout (T021) | app layout (T022) | Header/Footer (T023) | Router (T024) | TypescriptStaticPlug (T025) | HealthController (T028)

# Phase 3 — start together after Phase 2:
PageController index+about (T029) | PageHTML module (T030) | PostController (T033) | PostHTML module (T034)

# Polish — start together after all stories:
Dockerfile (T049) | fly.toml (T050) | Slugger tests (T051) | Renderer tests (T052) | SudokuLive tests (T054)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T009)
2. Complete Phase 2: Foundational (T010–T028) — **required gate**
3. Complete Phase 3: User Story 1 (T029–T040)
4. **STOP and VALIDATE**: home page lists posts, post pages render with code highlighting, RSS feed is valid, dark mode works
5. Deploy to Fly.io (needs T049–T050 from Phase 6 first)

### Incremental Delivery

| Milestone | Tasks | What Becomes Available |
|---|---|---|
| Foundation | T001–T028 | App boots, `/img` and `/healthz` work |
| MVP: Blog | +T029–T040 | Full blog reading experience, RSS, sitemap |
| Explainix | +T041–T043 | `/explainix` interactive Nix explorer |
| Sudoku | +T044–T048 | `/sudoku` exercises with full Preact interaction |
| Production | +T049–T055 | Docker image, Fly.io deploy, all tests passing |

---

## Task Count Summary

| Phase | Tasks | Notes |
|---|---|---|
| Phase 1: Setup | T001–T009 (9 tasks) | Project bootstrap + content migration |
| Phase 2: Foundational | T010–T028 (19 tasks) | Domain layer + web infrastructure |
| Phase 3: US1 — Blog | T029–T040 (12 tasks) | Home, about, post, RSS, sitemap, CSS/JS |
| Phase 4: US2 — Explainix | T041–T043 (3 tasks) | Controller action + template + island |
| Phase 5: US3 — Sudoku | T044–T048 (5 tasks) | List + LiveView + island |
| Phase 6: Polish | T049–T055 (7 tasks) | Deployment config + tests + quality gates |
| **Total** | **55 tasks** | |

### Parallel Opportunities: 28 of 55 tasks are marked [P]

### Independent Test Criteria per Story

| Story | Pass Condition |
|---|---|
| US1 | `/post/{slug}` renders full HTML with highlighted code, responsive images, sticky TOC — **no JavaScript required** |
| US2 | `/explainix` Preact island mounts, Nix tooltip shows on click, closes on Escape |
| US3 | `/sudoku/x-wing` puzzle interactive, hints work, unknown slug redirects to `/sudoku` |

### Suggested MVP Scope

**Phases 1 + 2 + 3** (Setup + Foundational + US1) = 40 tasks. This delivers a fully functional, production-deployable blog with all content, RSS, and sitemap — the core purpose of the site.
