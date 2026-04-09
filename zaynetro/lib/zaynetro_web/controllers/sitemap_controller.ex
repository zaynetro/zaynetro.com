defmodule ZaynetroWeb.SitemapController do
  use ZaynetroWeb, :controller

  alias Zaynetro.Blog.Cache

  def index(conn, _params) do
    posts = Cache.list_published_posts()
    xml = build_sitemap(posts)

    conn
    |> put_resp_content_type("application/xml")
    |> send_resp(200, xml)
  end

  defp build_sitemap(posts) do
    post_urls =
      Enum.map_join(posts, "\n", fn post ->
        """
          <url>
            <loc>https://www.zaynetro.com/post/#{post.slug}</loc>
            <lastmod>#{Date.to_iso8601(post.date)}</lastmod>
            <changefreq>monthly</changefreq>
            <priority>0.8</priority>
          </url>
        """
      end)

    """
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>https://www.zaynetro.com/</loc>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>https://www.zaynetro.com/about</loc>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
      </url>
      <url>
        <loc>https://www.zaynetro.com/explainix</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
      </url>
    #{post_urls}
    </urlset>
    """
  end
end
