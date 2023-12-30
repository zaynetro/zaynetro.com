import { defineRoute } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { Footer, Header } from "@/components/Header.tsx";
import Explainix from "@/islands/Explainix.tsx";

export default defineRoute((_req, ctx) => {
  return (
    <>
      <Head>
        <meta
          name="description"
          content="Explain Nix syntax visually"
        />
      </Head>

      <Header
        title="Explainix"
        url={ctx.url}
      />

      <main class="mt-8">
        <section class="max-w-5xl mx-auto flex flex-col gap-8 px-2">
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
