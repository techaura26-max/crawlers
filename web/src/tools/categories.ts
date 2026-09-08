export const categories = [
  { id: "game", name: "GAME TOOLS" },
  { id: "audio", name: "AUDIO TOOLS" },
  { id: "image", name: "IMAGE TOOLS" },
  { id: "ai", name: "AI TOOLS" },
  { id: "design", name: "COLOR TOOLS" },
] as const

export type CategoryId = (typeof categories)[number]["id"]
