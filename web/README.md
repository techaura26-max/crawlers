# Tools Hub development

## Source boundaries

| Area                                          | Source                                                          |
| --------------------------------------------- | --------------------------------------------------------------- |
| Homepage category presentation                | `src/homepage/categories.ts`                                    |
| Existing Three.js scene and rotation          | `src/js/gl/fslider/`                                            |
| Homepage drawer                               | `src/components/homepage/ToolsPanel.astro`                      |
| Category names and IDs                        | `src/tools/categories.ts`                                       |
| Tool metadata and URLs                        | `src/tools/registry.ts`                                         |
| Automatic routes                              | `src/pages/[category]/`                                         |
| Shared tool shell and rendering               | `src/layouts/ToolLayout.astro`, `src/components/ToolPage.astro` |
| Audio UI, format definitions and WASM wrapper | `src/components/tools/audio/`                                   |

## Add a tool

1. Add an Astro component, for example `src/components/tools/image/ResizeImage.astro`.
   This can contain native Astro markup and a client script, or wrap a React island.
   Keep tool-specific code and styles in that tool's directory.
2. Add one object to `entries` in `src/tools/registry.ts`:

```ts
{
  id: "resize-image",
  name: "Resize Image",
  category: "image",
  description: "Resize images on your device.",
  component: "image/ResizeImage",
}
```

The build creates `/image/resize-image`, the `/image/` category index and the
homepage Image Tools panel link automatically. No page or navigation edits are
needed. The example above is instructional and is not a registered tool.

Category IDs: `game`, `audio`, `image`, `ai`, `design`.
Optional serializable `props` are passed to the component. `categoryIndex: true`
makes a tool the category's landing page, as Audio Converter is for `/audio/`.
Set `panel: false` to omit a less common variation from the short homepage list.
Duplicate routes or missing components fail the build.

Astro statically generates pages: adding a tool still requires one rebuild and
deployment of the same project. Each page loads only its own client components.

## Audio formats and behavior

`audioData.ts` is the only format catalog. Each format defines accepted input
extensions; a format with an `output` defines an encoder, container, MIME type
and filename extension. The registry derives all supported non-identical format
pairs from this catalog. `/audio/mp3-to-wav`, `/audio/wav-to-mp3` and
`/audio/flac-to-wav` are examples. Invalid pairs have no static route.

AMR and APE are input-only with the supplied core. ALAC writes an `.m4a` container;
WebM audio uses `.webm`/`.weba` input rather than the nonstandard `WEBMAUDIO` suffix.
Extensions identify candidate containers; FFmpeg validates the actual audio.

From/To selection and Swap use the History API without remounting the React
island. Back/Forward restores the pair and metadata. A format change clears the
file and previous result. Controls are locked during a conversion, and Cancel
terminates its worker. Errors can be retried. Event handlers, temporary FFmpeg
files, blob URLs and workers are cleaned up.

The single-thread FFmpeg core is lazy-loaded when Convert is pressed. It runs in
a browser worker, so no audio is uploaded and no server API is required. It does
not require cross-origin isolation headers or SharedArrayBuffer. Files are limited
to 500 MB, but practical limits depend on the device's available memory.

## Build and hosting

Run from the repository root:

```sh
pnpm install
pnpm dev:web
pnpm check
pnpm build:web
```

`build:web` runs `astro check` before `astro build`. Root `pnpm check` also checks
the preserved package/build TypeScript. Both configs use Bundler resolution and
explicit `rootDir`; aliases use relative paths without `baseUrl`. No deprecation
warnings are suppressed. `@package/*` points at the retained package source and
`@slider/*` at its `src` directory, replacing the deleted experimental demo path.

Publish `web/dist` with a static host supporting directory index routes. Set
`SITE_URL` to the real production origin at build time to emit canonical URLs and
a sitemap. No old demo domain is used when this variable is absent. The development
server accepts `terminal.local` for the supervised preview and defaults to loopback
for ordinary local development.

FFmpeg's JS and approximately 31 MB WASM core are emitted as local static assets
with content hashes; they do not depend on a third-party CDN. The host must serve
`.wasm` as `application/wasm` and permit assets of that size. The core downloads
only when the user starts their first conversion. Keep upstream package license
notices when redistributing these assets.

The workspace allows install scripts only for its existing Bun, esbuild and sharp
dependencies. Matching `allowBuilds` and `onlyBuiltDependencies` entries support
both pnpm 11 and the pinned pnpm 10 release.
