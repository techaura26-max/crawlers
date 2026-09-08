import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile } from "@ffmpeg/util"
import coreURL from "@ffmpeg/core?url"
import wasmURL from "@ffmpeg/core/wasm?url"
import type { AudioFormat } from "./audioData"

export class AudioEngine {
  private ffmpeg = new FFmpeg()
  private loading: Promise<boolean> | null = null

  async load() {
    if (this.ffmpeg.loaded) return
    // The single-thread core runs in a worker without SharedArrayBuffer or COOP/COEP.
    this.loading ??= this.ffmpeg.load({ coreURL, wasmURL })
    let timeout: ReturnType<typeof setTimeout>
    try {
      await Promise.race([
        this.loading,
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () =>
              reject(
                new Error(
                  "The audio engine could not load. Please check your connection and try again."
                )
              ),
            90_000
          )
        }),
      ])
    } catch (error) {
      this.dispose()
      throw error
    } finally {
      clearTimeout(timeout!)
    }
  }

  async convert(
    file: File,
    from: AudioFormat,
    to: AudioFormat,
    onProgress: (value: number) => void
  ) {
    if (!to.output) throw new Error("This output format is not supported.")
    const input = `input.${file.name.split(".").pop()?.toLowerCase() || from.extensions[0]}`
    const output = `output.${to.output.extension}`
    const progress = ({ progress }: { progress: number }) => {
      if (Number.isFinite(progress))
        onProgress(Math.min(99, Math.max(0, Math.round(progress * 100))))
    }
    this.ffmpeg.on("progress", progress)
    try {
      await this.ffmpeg.writeFile(input, await fetchFile(file))
      const code = await this.ffmpeg.exec([
        "-i",
        input,
        "-map",
        "0:a:0",
        "-vn",
        ...to.output.args,
        output,
      ])
      if (code !== 0)
        throw new Error(
          "Could not convert this file. It may be damaged or use an unsupported codec."
        )
      const data = await this.ffmpeg.readFile(output)
      if (typeof data === "string" || !data.length)
        throw new Error("The conversion produced no audio.")
      onProgress(100)
      return {
        blob: new Blob([new Uint8Array(data)], { type: to.output.mime }),
        name: `${file.name.replace(/\.[^.]+$/, "")}_converted.${to.output.extension}`,
      }
    } finally {
      this.ffmpeg.off("progress", progress)
      await Promise.allSettled([
        this.ffmpeg.deleteFile(input),
        this.ffmpeg.deleteFile(output),
      ])
    }
  }

  dispose() {
    this.ffmpeg.terminate()
    this.loading = null
  }
}
