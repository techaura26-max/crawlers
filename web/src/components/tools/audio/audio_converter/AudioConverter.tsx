import { useEffect, useRef, useState } from "react"
import {
  audioFormats,
  getFormat,
  outputFormats,
  validateAudioFile,
  type AudioFormat,
} from "./audioData"
import {
  getAudioConversion,
  getToolByPath,
  toolTitle,
} from "../../../../tools/registry"
import type { AudioEngine } from "./audioEngine"
import "./audio-converter.css"

interface Props {
  initialFrom: string
  initialTo: string
}
type Status = "idle" | "loading" | "converting" | "done"
type Toast = { message: string; type: "success" | "error" }

export default function AudioConverter({ initialFrom, initialTo }: Props) {
  const [pair, setPair] = useState({ from: initialFrom, to: initialTo })
  const from = getFormat(pair.from)
  const to = getFormat(pair.to)
  const [selecting, setSelecting] = useState<"from" | "to" | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ url: string; name: string } | null>(
    null
  )
  const [toast, setToast] = useState<Toast | null>(null)
  const engine = useRef<AudioEngine | null>(null)
  const generation = useRef(0)
  const working = useRef(false)
  const input = useRef<HTMLInputElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const busy = status === "loading" || status === "converting"

  useEffect(
    () => () => {
      generation.current++
      engine.current?.dispose()
    },
    []
  )
  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result.url)
    },
    [result]
  )
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])
  useEffect(() => {
    if (selecting) dialog.current?.showModal()
    else dialog.current?.close()
  }, [selecting])

  function reset() {
    generation.current++
    if (working.current) {
      engine.current?.dispose()
      engine.current = null
    }
    working.current = false
    setFile(null)
    setResult(null)
    setProgress(0)
    setStatus("idle")
    setToast(null)
    if (input.current) input.current.value = ""
  }

  function updateMetadata(path: string) {
    const tool = getToolByPath(path)
    if (!tool) return
    document.title = toolTitle(tool)
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", tool.description)
    const canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    )
    if (canonical) canonical.href = new URL(tool.href, canonical.href).href
  }

  useEffect(() => {
    const onPopState = () => {
      const tool = getToolByPath(window.location.pathname)
      if (tool?.component !== "audio/AudioTool" || !tool.props) return
      reset()
      setSelecting(null)
      setPair({ from: String(tool.props.from), to: String(tool.props.to) })
      updateMetadata(window.location.pathname)
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  function changePair(next: { from: string; to: string }) {
    const tool = getAudioConversion(next.from, next.to)
    if (!tool) {
      setToast({
        type: "error",
        message:
          next.from === next.to
            ? "Choose two different formats."
            : "This format can be used as input only.",
      })
      return
    }
    if (next.from === pair.from && next.to === pair.to) {
      setSelecting(null)
      return
    }
    reset()
    setPair(next)
    setSelecting(null)
    // Keep the React island mounted and preserve the browser Back/Forward stack.
    window.history.pushState(null, "", tool.href)
    updateMetadata(tool.href)
  }

  function handleFile(selected: File) {
    if (working.current) return
    const error = validateAudioFile(selected, from)
    if (error) {
      setToast({ type: "error", message: error })
      return
    }
    setFile(selected)
    setResult(null)
    setProgress(0)
    setStatus("idle")
    setToast(null)
  }

  async function convert() {
    if (working.current) return
    if (!file) {
      setToast({
        type: "error",
        message: "Please select or drop an audio file first.",
      })
      return
    }
    const validation = validateAudioFile(file, from)
    if (validation) {
      setToast({ type: "error", message: validation })
      return
    }
    const run = ++generation.current
    working.current = true
    setStatus("loading")
    setProgress(0)
    setToast(null)
    try {
      const { AudioEngine } = await import("./audioEngine")
      if (run !== generation.current) return
      engine.current ??= new AudioEngine()
      await engine.current.load()
      if (run !== generation.current) return
      setStatus("converting")
      const converted = await engine.current.convert(file, from, to, value => {
        if (run === generation.current) setProgress(value)
      })
      if (run !== generation.current) return
      setResult({
        url: URL.createObjectURL(converted.blob),
        name: converted.name,
      })
      setStatus("done")
      setToast({
        type: "success",
        message: "Conversion complete. Your audio is ready to download.",
      })
    } catch (error) {
      if (run !== generation.current) return
      engine.current?.dispose()
      engine.current = null
      setStatus("idle")
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Conversion failed. Try another audio file or a smaller file.",
      })
    } finally {
      if (run === generation.current) working.current = false
    }
  }

  function formatButton(target: "from" | "to", format: AudioFormat) {
    return (
      <button
        className={`format-box ${selecting === target ? "active-format" : ""}`}
        type="button"
        disabled={busy}
        aria-label={`Choose ${target === "from" ? "input" : "output"} format: ${format.ext}`}
        aria-haspopup="dialog"
        onClick={() => setSelecting(target)}
      >
        <span className="format-kicker">
          {target === "from" ? "From" : "To"}
        </span>
        <span className="format-main">
          <span className={`file-icon ${format.iconClass}`} aria-hidden="true">
            {format.icon}
          </span>
          <span>
            <strong>{format.ext}</strong>
            <small>{format.description}</small>
          </span>
        </span>
        <span className="chevron" aria-hidden="true">
          ⌄
        </span>
      </button>
    )
  }

  return (
    <div className="audio-converter">
      <section className="intro">
        <div className="eyebrow">
          <span>{from.ext}</span>
          <span className="tiny-arrow" aria-hidden="true">
            ↔
          </span>
          <span>{to.ext}</span>
        </div>
        <h1>
          Switch the format.
          <br />
          <em>Keep the sound.</em>
        </h1>
        <p>
          Move from {from.ext} to {to.ext} with one clean, focused tool.
        </p>
      </section>
      <section className="converter-card" aria-label="Audio converter">
        <div className="card-topline">
          <div className="step-label">
            <span>01</span> Choose your conversion
          </div>
          <span className="status-pill" role="status">
            {status === "loading"
              ? "Loading engine…"
              : busy
                ? "Converting…"
                : status === "done"
                  ? "Complete"
                  : "On your device"}
          </span>
        </div>
        <div className="format-row">
          {formatButton("from", from)}
          <button
            className="swap-button"
            type="button"
            aria-label="Swap audio formats"
            disabled={busy || !from.output}
            title={
              from.output
                ? "Swap audio formats"
                : `${from.ext} is available as input only`
            }
            onClick={() => changePair({ from: pair.to, to: pair.from })}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7 7h11m0 0-3-3m3 3-3 3M17 17H6m0 0 3 3m-3-3 3-3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {formatButton("to", to)}
        </div>
        <label
          className={`drop-zone ${dragging ? "dragging" : ""}`}
          onDragOver={event => {
            event.preventDefault()
            if (!busy) setDragging(true)
          }}
          onDragLeave={event => {
            if (!event.currentTarget.contains(event.relatedTarget as Node))
              setDragging(false)
          }}
          onDrop={event => {
            event.preventDefault()
            setDragging(false)
            if (event.dataTransfer.files.length > 1)
              setToast({
                type: "error",
                message: "Please select one audio file at a time.",
              })
            else if (event.dataTransfer.files[0])
              handleFile(event.dataTransfer.files[0])
          }}
        >
          <input
            ref={input}
            type="file"
            aria-label="Choose audio file"
            disabled={busy}
            accept={from.extensions.map(ext => `.${ext}`).join(",")}
            onChange={event => {
              const selected = event.target.files?.[0]
              if (selected) handleFile(selected)
              event.target.value = ""
            }}
          />
          <span className="upload-icon" aria-hidden="true">
            <svg viewBox="0 0 28 28" fill="none">
              <path
                d="M14 19V6m0 0-5 5m5-5 5 5M6 18v2.5A2.5 2.5 0 0 0 8.5 23h11a2.5 2.5 0 0 0 2.5-2.5V18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="drop-copy">
            <strong>{file?.name || "Drop your audio here"}</strong>
            <span>
              {file ? (
                `${(file.size / 1024 / 1024).toFixed(2)} MB · File ready for conversion`
              ) : (
                <>
                  or <u>browse from your device</u>
                </>
              )}
            </span>
          </span>
          <span className="file-rule">
            Up to 500 MB · Available memory varies by device
          </span>
        </label>
        {result ? (
          <a
            className="convert-button"
            href={result.url}
            download={result.name}
          >
            <span>Download {to.ext}</span>
            <span className="button-arrow" aria-hidden="true">
              ↓
            </span>
          </a>
        ) : (
          <button
            className="convert-button"
            type="button"
            disabled={busy}
            onClick={convert}
          >
            <span>
              {status === "loading"
                ? "Loading audio engine…"
                : status === "converting"
                  ? `Converting… ${progress}%`
                  : `Convert to ${to.ext}`}
            </span>
            <span className="button-arrow" aria-hidden="true">
              ↗
            </span>
          </button>
        )}
        {busy && (
          <>
            <progress
              aria-label="Conversion progress"
              max="100"
              value={status === "loading" ? undefined : progress}
            />
            <button className="reset-button" type="button" onClick={reset}>
              Cancel
            </button>
          </>
        )}
        {result && (
          <button className="reset-button" type="button" onClick={reset}>
            Convert another file
          </button>
        )}
        <div className="trust-row">
          <span>Files stay on your device</span>
          <span>No account needed</span>
          <span>Free to use</span>
        </div>
      </section>
      <dialog
        ref={dialog}
        className="modal-container"
        aria-labelledby="format-title"
        onCancel={() => setSelecting(null)}
        onClose={() => setSelecting(null)}
        onClick={event => {
          if (event.target === event.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect()
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            )
              setSelecting(null)
          }
        }}
      >
        <div className="modal-header">
          <h2 id="format-title">
            Select {selecting === "from" ? "Input" : "Output"} Format
          </h2>
          <button
            className="close-btn"
            type="button"
            aria-label="Close format selector"
            onClick={() => setSelecting(null)}
          >
            ✕
          </button>
        </div>
        <div className="formats-grid">
          {(selecting === "from" ? audioFormats : outputFormats)
            .filter(
              format =>
                format.id !== (selecting === "from" ? pair.to : pair.from)
            )
            .map(format => (
              <button
                className="format-option"
                type="button"
                key={format.id}
                onClick={() => changePair({ ...pair, [selecting!]: format.id })}
              >
                <span
                  className={`file-icon ${format.iconClass}`}
                  aria-hidden="true"
                >
                  {format.icon}
                </span>
                <span className="format-info">
                  <strong>{format.ext}</strong>
                  <small>
                    {format.description}
                    {!format.output ? " · Input only" : ""}
                  </small>
                </span>
              </button>
            ))}
        </div>
      </dialog>
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toast && (
          <div
            className={`simple-toast ${toast.type}`}
            role={toast.type === "error" ? "alert" : "status"}
          >
            {toast.message}
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setToast(null)}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
