import { blogPosts } from "@/build/posts.gen.ts";

const isProd = !!Deno.env.get("DENO_DEPLOYMENT_ID");

export const publishedPosts = [...blogPosts.values()]
  // Exclude draft posts in production
  .filter((p) => isProd ? !p.draft : true)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
