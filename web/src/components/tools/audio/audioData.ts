export interface AudioFormat {
  id: string
  ext: string
  description: string
  icon: string
  iconClass: string
  extensions: string[]
  output?: { extension: string; mime: string; args: string[] }
}

// Input containers and output codecs are deliberately separate. APE and AMR
// can be decoded by this core but have no encoder in the shipped WASM build.
export const audioFormats: AudioFormat[] = [
  {
    id: "mp3",
    ext: "MP3",
    description: "Standard Audio",
    icon: "🎵",
    iconClass: "icon-mp3",
    extensions: ["mp3"],
    output: {
      extension: "mp3",
      mime: "audio/mpeg",
      args: ["-c:a", "libmp3lame", "-q:a", "2"],
    },
  },
  {
    id: "wav",
    ext: "WAV",
    description: "Lossless Audio",
    icon: "🌊",
    iconClass: "icon-wav",
    extensions: ["wav", "wave"],
    output: {
      extension: "wav",
      mime: "audio/wav",
      args: ["-c:a", "pcm_s16le"],
    },
  },
  {
    id: "flac",
    ext: "FLAC",
    description: "Free Lossless",
    icon: "💿",
    iconClass: "icon-flac",
    extensions: ["flac"],
    output: { extension: "flac", mime: "audio/flac", args: ["-c:a", "flac"] },
  },
  {
    id: "m4a",
    ext: "M4A",
    description: "Apple Audio",
    icon: "🍎",
    iconClass: "icon-apple",
    extensions: ["m4a"],
    output: {
      extension: "m4a",
      mime: "audio/mp4",
      args: ["-c:a", "aac", "-b:a", "192k"],
    },
  },
  {
    id: "aac",
    ext: "AAC",
    description: "Advanced Audio",
    icon: "📻",
    iconClass: "icon-general",
    extensions: ["aac"],
    output: {
      extension: "aac",
      mime: "audio/aac",
      args: ["-c:a", "aac", "-b:a", "192k", "-f", "adts"],
    },
  },
  {
    id: "ogg",
    ext: "OGG",
    description: "Vorbis Audio",
    icon: "📀",
    iconClass: "icon-general",
    extensions: ["ogg", "oga"],
    output: {
      extension: "ogg",
      mime: "audio/ogg",
      args: ["-c:a", "libvorbis", "-q:a", "5"],
    },
  },
  {
    id: "opus",
    ext: "OPUS",
    description: "Interactive Audio",
    icon: "🎮",
    iconClass: "icon-general",
    extensions: ["opus", "ogg"],
    output: {
      extension: "opus",
      mime: "audio/ogg",
      args: ["-c:a", "libopus", "-b:a", "128k"],
    },
  },
  {
    id: "wma",
    ext: "WMA",
    description: "Windows Media",
    icon: "🪟",
    iconClass: "icon-general",
    extensions: ["wma", "asf"],
    output: {
      extension: "wma",
      mime: "audio/x-ms-wma",
      args: [
        "-c:a",
        "wmav2",
        "-b:a",
        "192k",
        "-ar",
        "44100",
        "-ac",
        "2",
        "-f",
        "asf",
      ],
    },
  },
  {
    id: "aiff",
    ext: "AIFF",
    description: "Audio Interchange",
    icon: "📼",
    iconClass: "icon-general",
    extensions: ["aiff", "aif"],
    output: {
      extension: "aiff",
      mime: "audio/aiff",
      args: ["-c:a", "pcm_s16be"],
    },
  },
  {
    id: "alac",
    ext: "ALAC",
    description: "Apple Lossless",
    icon: "🍏",
    iconClass: "icon-apple",
    extensions: ["m4a", "alac"],
    output: { extension: "m4a", mime: "audio/mp4", args: ["-c:a", "alac"] },
  },
  {
    id: "amr",
    ext: "AMR",
    description: "Adaptive Multi-Rate",
    icon: "📞",
    iconClass: "icon-general",
    extensions: ["amr"],
  },
  {
    id: "webm",
    ext: "WEBM",
    description: "Web Audio",
    icon: "🌐",
    iconClass: "icon-general",
    extensions: ["webm", "weba"],
    output: {
      extension: "webm",
      mime: "audio/webm",
      args: ["-c:a", "libopus", "-b:a", "128k", "-f", "webm"],
    },
  },
  {
    id: "ac3",
    ext: "AC3",
    description: "Dolby Digital",
    icon: "🎞️",
    iconClass: "icon-general",
    extensions: ["ac3"],
    output: {
      extension: "ac3",
      mime: "audio/ac3",
      args: ["-c:a", "ac3", "-b:a", "192k", "-ar", "48000"],
    },
  },
  {
    id: "ape",
    ext: "APE",
    description: "Monkey's Audio",
    icon: "🐒",
    iconClass: "icon-general",
    extensions: ["ape"],
  },
]

export const outputFormats = audioFormats.filter(format => format.output)
export const defaultConversion = { from: "mp3", to: "wav" }
export const maxFileBytes = 500 * 1024 * 1024

export function getFormat(id: string): AudioFormat {
  const format = audioFormats.find(format => format.id === id)
  if (!format) throw new Error(`Unknown audio format: ${id}`)
  return format
}

export function validateAudioFile(
  file: Pick<File, "name" | "size">,
  format: AudioFormat
) {
  if (!file.size) return "This file is empty. Please select an audio file."
  if (file.size > maxFileBytes)
    return "File is too large. Maximum size is 500 MB."
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (!extension || !format.extensions.includes(extension)) {
    return `Invalid file type. Please choose ${format.extensions.map(ext => `.${ext}`).join(" or ")}.`
  }
  return null
}
