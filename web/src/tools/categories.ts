export const categories = [
  {
    id: "game",
    name: "GAME TOOLS",
    shortName: "Game",
    description: "Utility, precision and a better way to play.",
    accent: "#d7ff5f",
    accentRgb: "215, 255, 95",
  },
  {
    id: "audio",
    name: "AUDIO TOOLS",
    shortName: "Audio",
    description: "Convert and shape sound without leaving your browser.",
    accent: "#80a7ff",
    accentRgb: "128, 167, 255",
  },
  {
    id: "image",
    name: "IMAGE TOOLS",
    shortName: "Image",
    description: "Fast visual utilities for every kind of canvas.",
    accent: "#ff8b66",
    accentRgb: "255, 139, 102",
  },
  {
    id: "ai",
    name: "AI TOOLS",
    shortName: "AI",
    description: "Practical intelligence built for real momentum.",
    accent: "#b798ff",
    accentRgb: "183, 152, 255",
  },
  {
    id: "design",
    name: "COLOR TOOLS",
    shortName: "Color",
    description: "Make every palette, contrast and detail feel intentional.",
    accent: "#ffcf59",
    accentRgb: "255, 207, 89",
  },
] as const

export type CategoryId = (typeof categories)[number]["id"]
