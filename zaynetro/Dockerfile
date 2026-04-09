# Build stage
FROM hexpm/elixir:1.17.3-erlang-27.1-debian-bookworm-20240904-slim AS builder

RUN apt-get update -y && \
    apt-get install -y build-essential git curl libvips-dev && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN mix local.hex --force && mix local.rebar --force

ENV MIX_ENV=prod

COPY mix.exs mix.lock ./
RUN mix deps.get --only prod
RUN mix deps.compile

COPY assets/package.json assets/package-lock.json ./assets/
RUN npm install --prefix assets

COPY . .

RUN mix assets.deploy
RUN mix release

# Runtime stage
FROM debian:bookworm-slim AS app

RUN apt-get update -y && \
    apt-get install -y libstdc++6 openssl libncurses5 locales libvips42 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

WORKDIR /app
RUN chown nobody /app

COPY --from=builder --chown=nobody:root /app/_build/prod/rel/zaynetro ./

USER nobody

ENV HOME=/tmp
EXPOSE 4000

CMD ["/app/bin/server"]
