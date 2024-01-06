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

        <style dangerouslySetInnerHTML={{ __html: GFM_VARS }} />
        <style dangerouslySetInnerHTML={{ __html: GFM_CSS }} />
        <style dangerouslySetInnerHTML={{ __html: GFM_CSS_CODE }} />
        <style dangerouslySetInnerHTML={{ __html: GFM_CSS_CUSTOM }} />
        <style dangerouslySetInnerHTML={{ __html: overrides }} />
      </Head>

      <Header
        title="Explainix"
        url={ctx.url}
      />

      <main class="mt-8">
        <section class="max-w-6xl mx-auto flex flex-col gap-8 px-2">
          <h1 class="text-2xl flex gap-4 items-center">
            <img
              src="/images/nix-snowflake.svg"
              class="w-[48px] h-[48px]"
              alt="Nix snowflake logo"
            />
            Explainix
          </h1>
          <p class="text-lg">
            Explain Nix syntax visually. Snippet below showcases all language
            features Nix has to offer. <i>WORK IN PROGRESS</i>
          </p>

          <Explainix />
        </section>
      </main>

      <Footer />
    </>
  );
});
