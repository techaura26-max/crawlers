/// <reference types="astro/client" />

interface Window {
  app: {
    loader: {
      circle: SVGCircleElement | null
      timeouts: ReturnType<typeof setTimeout>[]
    }
  }
}
