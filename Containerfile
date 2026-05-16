# UbiCity container — Deno runtime.
#
# This project is Deno-first (deno.json tasks, Deno.* filesystem APIs,
# jsr:@std/* + npm: deps). The previous Node Containerfile could not run
# it. Pinned to the .tool-versions deno so a plain `git clone` builds an
# image that runs the full test suite and CLI with no host toolchain.
#
#   docker build -t ubicity .
#   docker run --rm ubicity                       # CLI help
#   docker run --rm ubicity deno task stats
#   docker run --rm -v ./data:/app/ubicity-data ubicity deno task report
#   docker run --rm ubicity \
#     deno test --allow-read --allow-write tests/  # full suite (44 tests)
FROM denoland/deno:2.7.14

WORKDIR /app

# Manifests first for build-cache friendliness.
COPY deno.json deno.lock package.json ./

# Application + tests + assets (.dockerignore trims git/node_modules/etc).
COPY . .

# Warm the module cache: jsr:@std/* + npm: deps. nodeModulesDir "auto"
# in deno.json materialises node_modules at build time so runtime needs
# no network.
RUN deno cache src/index.js

# Data directory (mountable volume for persistence).
RUN mkdir -p ubicity-data/experiences ubicity-data/analyses ubicity-data/maps
VOLUME ["/app/ubicity-data"]

ENV UBICITY_LOG_LEVEL=info

# Default: CLI help. Override the args to run any deno task / test, e.g.
#   docker run --rm ubicity test --allow-read --allow-write tests/
ENTRYPOINT ["deno"]
CMD ["run", "--allow-read", "--allow-write", "src/cli.js", "help"]
