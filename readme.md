# Crawlers

Crawlers is a Tools Hub built with Astro 5. The homepage retains its Three.js
slider; tools use independent Astro pages and optional React islands.

```sh
pnpm install
pnpm dev:web
pnpm check
pnpm build:web
```

The production output remains `web/dist`. `pnpm dev` also starts the website.
For access from another device, run `pnpm --dir web dev --host 0.0.0.0`.

See [web/README.md](web/README.md) for adding tools, formats and deployment settings.

The existing slider package source in `package/`, package build scripts in `bin/`,
all GLB models and their credits remain in the repository. The homepage continues
to use the existing `smooothy` runtime dependency. Its MIT attribution is retained
in [LICENSE](LICENSE); model credits are in [docs/credits.md](docs/credits.md).

The audio interface and behavior were ported from `crawlersjo-byte/crawlers` to
React; no Angular application or Angular runtime is included. FFmpeg packages
retain their upstream licenses (`@ffmpeg/core` is GPL-2.0-or-later).
