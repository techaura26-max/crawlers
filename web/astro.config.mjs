// @ts-check
import { defineConfig } from "astro/config"
import glsl from "vite-plugin-glsl"

import tailwindcss from "@tailwindcss/vite"
import react from "@astrojs/react"

import sitemap from "@astrojs/sitemap"

export default defineConfig({
  vite: {
    server: { allowedHosts: ["terminal.local"] },
    optimizeDeps: { exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"] },
    worker: { format: "es" },
    plugins: [
      tailwindcss(),
      glsl({
        include: [
          "**/*.glsl",
          "**/*.wgsl",
          "**/*.vert",
          "**/*.frag",
          "**/*.vs",
          "**/*.fs",
        ],
        exclude: undefined,
        warnDuplicatedImports: true,
        removeDuplicatedImports: false,
        defaultExtension: "glsl",
        compress: true,
        watch: true,
        root: "/",
      }),
    ],
  },
  devToolbar: {
    enabled: false,
  },
  // Set SITE_URL to the production origin to generate canonical URLs and a sitemap.
  site: process.env.SITE_URL,
  integrations: [react(), ...(process.env.SITE_URL ? [sitemap()] : [])],
})
