import {
  audioFormats,
  defaultConversion,
  outputFormats,
} from "../components/tools/audio/audioData"
import type { CategoryId } from "./categories"

export interface Tool {
  id: string
  name: string
  category: CategoryId
  description: string
  // Relative to src/components/tools; generic routes load this Astro component.
  component: string
  props?: Record<string, unknown>
  categoryIndex?: boolean
  panel?: boolean
  href: string
}

type ToolEntry = Omit<Tool, "href">
const popularConversions = [
  "mp3-to-wav",
  "wav-to-mp3",
  "flac-to-wav",
  "flac-to-mp3",
  "m4a-to-wav",
]

// Add an Astro component and one entry here. Routes and category lists follow.
const entries: ToolEntry[] = [
  {
    id: "audio-converter",
    name: "Audio Converter",
    category: "audio",
    description: "Convert audio privately in your browser.",
    component: "audio/AudioTool",
    props: defaultConversion,
    categoryIndex: true,
  },
  ...audioFormats.flatMap(from =>
    outputFormats
      .filter(to => to.id !== from.id)
      .map(to => ({
        id: `${from.id}-to-${to.id}`,
        name: `${from.ext} to ${to.ext}`,
        category: "audio" as const,
        description: `Convert ${from.ext} audio to ${to.ext} for free, directly on your device.`,
        component: "audio/AudioTool",
        props: { from: from.id, to: to.id },
        panel: popularConversions.includes(`${from.id}-to-${to.id}`),
      }))
  ),
]

export const tools: Tool[] = entries.map(entry => ({
  ...entry,
  href: entry.categoryIndex
    ? `/${entry.category}/`
    : `/${entry.category}/${entry.id}`,
}))

const routes = new Set<string>()
for (const tool of tools) {
  if (routes.has(tool.href))
    throw new Error(`Duplicate tool route: ${tool.href}`)
  routes.add(tool.href)
}

export const getToolsByCategory = (category: CategoryId) =>
  tools.filter(tool => tool.category === category)
export const getPanelTools = (category: CategoryId) =>
  getToolsByCategory(category).filter(tool => tool.panel !== false)
export const getAudioConversion = (from: string, to: string) =>
  tools.find(
    tool => tool.category === "audio" && tool.id === `${from}-to-${to}`
  )
export const getToolByPath = (path: string) =>
  tools.find(tool => tool.href.replace(/\/$/, "") === path.replace(/\/$/, ""))
export const toolTitle = (tool: Tool) => `${tool.name} | Crawlers`
