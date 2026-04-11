# Node stage
FROM node:24-slim AS node

# Build stage
FROM hexpm/elixir:1.19-erlang-26.0-rc2-debian-trixie-20260406-slim AS builder

RUN apt-get update -y && \
    apt-get install -y build-essential git && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

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
FROM debian:trixie-slim AS app

RUN apt-get update -y && \
    apt-get install -y libstdc++6 openssl locales && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

WORKDIR /app
RUN chown nobody /app

COPY --from=builder --chown=nobody:root /app/_build/prod/rel/zaynetro ./
COPY --from=builder --chown=nobody:root /app/posts ./posts

ENV POSTS_DIR=/app/posts

USER nobody

ENV HOME=/tmp
EXPOSE 4000

CMD ["/app/bin/server"]
