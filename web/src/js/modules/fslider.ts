import Core from "smooothy"
import { Raf } from "../utils/subscribable"
import { Gl } from "../gl/gl"
import { symmetricMod } from "../utils/math"
import { hey } from "../hey"
import { damp } from "../utils/math"

const GRID_PARALLAX = 34

export const calculateSlidePosition = (index, slider) => {
  const unitPos = slider.current + index
  const wrappedPos = symmetricMod(unitPos, slider.items.length)

  return (
    (wrappedPos - index) *
    slider.viewport.itemWidth *
    Gl.vp.px
  )
}

export class FSlider extends Core {
  #queue = []
  #current = 0
  #raf = Raf.subscribe(this.update.bind(this), 11)

  #element: HTMLElement
  #panel: HTMLElement
  #drawer: HTMLElement
  #closeButton: HTMLButtonElement
  #triggers: HTMLButtonElement[]
  #views: HTMLElement[]

  #activeTrigger: HTMLButtonElement | null = null

  #panelIsOpen = false

  #pointerIsDown = false
  #pointerMoved = false

  #pointerStart = {
    x: 0,
    y: 0,
  }

  declare _timeout:
    | ReturnType<typeof setTimeout>
    | undefined

  lspeed = 0
  lprogress = 0

  #buttons: HTMLUListElement[]
  #progress: HTMLDivElement
  #arrows: HTMLButtonElement[]

  constructor(element: HTMLElement) {
    super(
      element.querySelector(
        '[data-slider="wrapper"]'
      ),
      {
        lerpFactor: 0.27,
      }
    )

    this.#element = element

    hey.FSLIDER = this

    this.createInterface(element)
    this.createToolsPanel(element)
  }

  createInterface(element: HTMLElement) {
    this.#buttons = [
      ...element.querySelector(
        '[data-slider="controls"]'
      ).children[0].children,
    ] as HTMLUListElement[]

    this.#progress = element.querySelector(
      '[data-slider="controls"]'
    ) as HTMLDivElement

    this.#arrows = [
      ...element.querySelector(
        '[data-slider="arrows"]'
      ).children,
    ] as HTMLButtonElement[]

    this.#buttons.forEach((button, i) => {
      button.onclick = () => this.goToIndex(i)
    })

    this.#arrows.forEach((button, i) => {
      ;(
        button.children[0] as HTMLElement
      ).onclick = () =>
        i === 0
          ? this.goToPrev()
          : this.goToNext()
    })
  }

  createToolsPanel(element: HTMLElement) {
    this.#panel = element.querySelector(
      "[data-tools-panel]"
    ) as HTMLElement

    this.#drawer = element.querySelector(
      "[data-tools-drawer]"
    ) as HTMLElement

    this.#closeButton =
      element.querySelector(
        "[data-tools-close]"
      ) as HTMLButtonElement

    this.#triggers = [
      ...element.querySelectorAll(
        "[data-tools-trigger]"
      ),
    ] as HTMLButtonElement[]

    this.#views = [
      ...element.querySelectorAll(
        "[data-tools-view]"
      ),
    ] as HTMLElement[]

    this.#drawer.inert = true

    this.#triggers.forEach(trigger => {
      trigger.addEventListener(
        "pointerdown",
        this.onTriggerPointerDown
      )

      trigger.addEventListener(
        "click",
        this.onTriggerClick
      )
    })

    window.addEventListener(
      "pointermove",
      this.onTriggerPointerMove
    )

    window.addEventListener(
      "pointerup",
      this.onTriggerPointerEnd
    )

    window.addEventListener(
      "pointercancel",
      this.onTriggerPointerCancel
    )

    document.addEventListener(
      "keydown",
      this.onPanelKeyDown
    )

    element
      .querySelector("[data-tools-overlay]")
      ?.addEventListener(
        "click",
        this.closeToolsPanel
      )

    this.#closeButton.addEventListener(
      "click",
      this.closeToolsPanel
    )
  }

  onTriggerPointerDown = (
    event: PointerEvent
  ) => {
    this.#pointerIsDown = true
    this.#pointerMoved = false

    this.#pointerStart.x = event.clientX
    this.#pointerStart.y = event.clientY
  }

  onTriggerPointerMove = (
    event: PointerEvent
  ) => {
    if (
      !this.#pointerIsDown ||
      this.#pointerMoved
    )
      return

    const distance = Math.hypot(
      event.clientX - this.#pointerStart.x,
      event.clientY - this.#pointerStart.y
    )

    if (distance > 9) {
      this.#pointerMoved = true
    }
  }

  onTriggerPointerEnd = () => {
    this.#pointerIsDown = false
  }

  onTriggerPointerCancel = () => {
    this.#pointerIsDown = false
    this.#pointerMoved = true
  }

  onTriggerClick = (
    event: MouseEvent
  ) => {
    if (
      event.detail !== 0 &&
      this.#pointerMoved
    ) {
      event.preventDefault()
      return
    }

    const trigger =
      event.currentTarget as HTMLButtonElement

    const sectionIndex = Number(
      trigger.dataset.sectionIndex
    )

    if (!Number.isInteger(sectionIndex)) {
      return
    }

    this.openToolsPanel(
      sectionIndex,
      trigger
    )
  }

  openToolsPanel = (
    sectionIndex: number,
    trigger: HTMLButtonElement
  ) => {
    const selectedView =
      this.#views.find(
        view =>
          Number(
            view.dataset.sectionIndex
          ) === sectionIndex
      )

    if (!selectedView) return

    this.#views.forEach(view => {
      view.hidden =
        view !== selectedView
    })

    this.#triggers.forEach(item => {
      const isSelected =
        item === trigger

      item.setAttribute(
        "aria-expanded",
        String(isSelected)
      )

      item.toggleAttribute(
        "data-panel-selected",
        isSelected
      )
    })

    this.#activeTrigger = trigger
    this.#panelIsOpen = true

    this.paused = true

    this.#drawer.inert = false

    this.#drawer.setAttribute(
      "aria-labelledby",
      `tools-panel-title-${sectionIndex}`
    )

    this.#panel.setAttribute(
      "aria-hidden",
      "false"
    )

    this.#element.dataset.panelOpen =
      "true"

    document.documentElement.classList.add(
      "tools-panel-open"
    )

    requestAnimationFrame(() =>
      this.#closeButton.focus()
    )
  }

  closeToolsPanel = () => {
    if (!this.#panelIsOpen) return

    this.#panelIsOpen = false
    this.paused = false

    this.#drawer.inert = true

    this.#panel.setAttribute(
      "aria-hidden",
      "true"
    )

    this.#element.dataset.panelOpen =
      "false"

    document.documentElement.classList.remove(
      "tools-panel-open"
    )

    this.#triggers.forEach(trigger => {
      trigger.setAttribute(
        "aria-expanded",
        "false"
      )

      trigger.removeAttribute(
        "data-panel-selected"
      )
    })

    this.#activeTrigger?.focus({
      preventScroll: true,
    })

    this.#activeTrigger = null
  }

  onPanelKeyDown = (
    event: KeyboardEvent
  ) => {
    if (!this.#panelIsOpen) return

    if (event.key === "Escape") {
      event.preventDefault()
      this.closeToolsPanel()
      return
    }

    if (event.key !== "Tab") return

    const activeView =
      this.#views.find(
        view => !view.hidden
      )

    const focusable = [
      this.#closeButton,
      ...(activeView?.querySelectorAll(
        "a[href]"
      ) ?? []),
    ] as HTMLElement[]

    const first = focusable[0]
    const last =
      focusable[
        focusable.length - 1
      ]

    if (
      event.shiftKey &&
      document.activeElement === first
    ) {
      event.preventDefault()
      last.focus()
    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault()
      first.focus()
    }
  }

  onUpdate = () => {
    this.lspeed = damp(
      this.lspeed,
      this.speed,
      10
    )

    this.lprogress = damp(
      this.lprogress,
      this.progress,
      5
    )

    /*
      GRID PARALLAX

      "current" already follows the slider
      smoothly, including drag + inertia +
      snapping.

      One full slide moves the grid by 34px.
    */
    const gridX =
      this.current * GRID_PARALLAX

    document.documentElement.style.setProperty(
      "--grid-drag-x",
      `${gridX}px`
    )

    if (
      Gl.scene &&
      Gl.scene.fslider
    ) {
      Gl.scene.fslider.children.forEach(
        (child, i) => {
          const arr =
            calculateSlidePosition(
              i,
              this
            )

          ;(
            child as typeof child & {
              onSlide?: (
                position: number
              ) => void
            }
          ).onSlide?.(arr)
        }
      )
    }

    ;(
      this.#progress
        .children[0] as HTMLElement
    ).style.left = `${
      this.lprogress *
      this.#progress.clientWidth
    }px`
  }

  onSlideChange = (
    index: number
  ) => {
    this.#queue.push(index)

    if (this._timeout) {
      clearTimeout(this._timeout)
    }

    this._timeout = setTimeout(
      () => {
        const lastIndex =
          this.#queue[
            this.#queue.length - 1
          ]

        this.#queue = []

        this.onSettled(lastIndex)
      },
      350
    )
  }

  onSettled = index => {
    this.items[
      this.#current
    ].classList.remove("active")

    this.items[
      index
    ].classList.add("active")

    this.#buttons[
      this.#current
    ].classList.remove("active")

    this.#buttons[
      index
    ].classList.add("active")

    hey.FSLIDE_CHANGE = [
      index,
      this.#current,
    ]

    this.#current = index
  }
}