defmodule ZaynetroWeb.FeedController do
  use ZaynetroWeb, :controller

  alias Zaynetro.Blog.Cache

  def index(conn, _params) do
    posts = Cache.list_published_posts()
    xml = build_rss(posts)

    conn
    |> put_resp_content_type("application/rss+xml")
    |> send_resp(200, xml)
  end

  defp build_rss(posts) do
    items = Enum.map_join(posts, "\n", &build_item/1)

    """
    <?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>Roman Zaynetdinov (zaynetro)</title>
        <link>https://www.zaynetro.com</link>
        <atom:link href="https://www.zaynetro.com/feed.rss" rel="self" type="application/rss+xml"/>
        <description>Welcome to my personal blog! I write about software development, interesting projects, and technical discoveries.</description>
        <language>en-US</language>
    #{items}
      </channel>
    </rss>
    """
  end

  defp build_item(post) do
    pub_date = Calendar.strftime(post.date, "%a, %d %b %Y 00:00:00 +0000")

    description =
      if post.description,
        do: "<description><![CDATA[#{post.description}]]></description>",
        else: ""

    """
        <item>
          <title><![CDATA[#{post.title}]]></title>
          <guid isPermaLink="false">https://www.zaynetro.com/post/#{post.slug}</guid>
          <link>https://www.zaynetro.com/post/#{post.slug}</link>
          <pubDate>#{pub_date}</pubDate>
          #{description}
        </item>
    """
  end
end
