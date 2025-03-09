import { defineRoute } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { Footer, Header } from "@/components/Header.tsx";
import Explainix from "@/islands/Explainix.tsx";
import {
  GFM_CSS,
  GFM_CSS_CODE,
  GFM_CSS_CUSTOM,
  GFM_VARS,
} from "@/utils/css.ts";

const overrides = `
.markdown-body .highlight pre, .markdown-body pre {
  padding: 8px;
}
`;

export default defineRoute((_req, ctx) => {
  return (
    <>
      <Head>
        <meta
          name="description"
          content="Explain Nix syntax visually"
        />

        <style>{GFM_VARS}</style>
        <style>{GFM_CSS}</style>
        <style>{GFM_CSS_CODE}</style>
        <style>{GFM_CSS_CUSTOM}</style>
        <style>{overrides}</style>
      </Head>

      <Header
        title="Explainix"
        url={ctx.url}
      />

      <main class="mt-4">
        <section class="max-w-6xl mx-auto flex flex-col gap-8 px-2">
          <h1 class="text-2xl flex gap-4 items-center">
            <img
              src="/images/nix-snowflake.svg"
              class="w-[36px] h-[36px]"
              alt="Nix snowflake logo"
            />
            Explainix
          </h1>
          <div class="text-lg max-w-2xl flex flex-col gap-4">
            <p>
              Explain Nix syntax visually. Snippet below showcases most of the
              language features Nix has to offer.
            </p>
            <p>
              Hover over any element to highlight its bounds. Click on any
              element to display help.
            </p>
          </div>

          <Explainix />
        </section>
      </main>

      <Footer />
      {/* Give enough room for all popups to be seen */}
      <div class="h-80" />
    </>
  );
});
