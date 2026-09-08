import { SliderGroup } from "../dom/group"
import gsap from "../../gsap"

import { hey } from "../../hey"
import { Gl } from "../gl"
import { Raf } from "../../utils/subscribable"
import { Observe } from "../../modules/_/observe"

import { Bg } from "./bg/"
import { Food } from "./food"

import { SLIDER_FOOD } from "../../../homepage/categories"

import {
  Box3,
  Vector3,
  Group,
} from "three"

export class Slide extends SliderGroup {
  #visible = true

  #raf = Raf.subscribe(t =>
    this.raf(t)
  )

  #observe = new Observe(
    this.element,
    {
      callback: ({ isIn }) => {
        this.handleInView(isIn)
      },
    }
  )

  #onLoad = hey.on(
    "WEBGL_LOADED",
    () => this.onLoad()
  )

  #onStart = hey.on(
    "START",
    () => this.animateIn()
  )

  #onSlideSettle = hey.on(
    "FSLIDE_CHANGE",
    ([current, old]) =>
      this.onSettle(
        current,
        old
      )
  )

  constructor(
    element,
    { index }
  ) {
    super(element, {
      index,
    })

    this.lib =
      SLIDER_FOOD[index]

    this.element =
      element

    this.index =
      index

    this.bg =
      new Bg(this.lib)

    this.add(this.bg)

    this.bg.visible =
      false
  }

  onLoad = () => {
    const modelKeys = [
      "controller",
      "headphones",
      "camera",
      "robot",
      "color",
    ]

    const modelKey =
      modelKeys[this.index]

    const source =
      Gl.scene.assets[
        modelKey
      ].clone(true)

    /*
     * Measure model.
     */
    const box =
      new Box3().setFromObject(
        source
      )

    const size =
      new Vector3()

    const center =
      new Vector3()

    box.getSize(size)
    box.getCenter(center)

    /*
     * Center model around its real bounds.
     */
    source.position.x -=
      center.x

    source.position.y -=
      center.y

    source.position.z -=
      center.z

    /*
     * Normalize model sizes.
     */
const maxSize = Math.max(size.x, size.y, size.z)

/*
 * Responsive model size
 *
 * Desktop keeps the original size.
 * Tablets and phones get progressively
 * smaller models so they never overlap
 * or leave the viewport.
 */
const viewportWidth = window.innerWidth

let targetSize = 1.2

if (viewportWidth <= 480) {
  targetSize = 0.76
} else if (viewportWidth <= 640) {
  targetSize = 0.84
} else if (viewportWidth <= 900) {
  targetSize = 0.92
} else if (viewportWidth <= 1100) {
  targetSize = 1.0
}

const scale = targetSize / maxSize

const wrapper = new Group()
wrapper.add(source)
wrapper.scale.setScalar(scale)

    this.food =
      new Food(
        wrapper,
        this.index,
        this.lib
      )

    this.add(
      this.food
    )
  }

  resize() {
    this.bg.scale.set(
      this.bounds.width,
      this.bounds.height,
      1
    )
  }

  raf = ({ time }) => {
    this.bg.speed =
      hey.FSLIDER.lspeed

    this.bg.time =
      time * 0.4

    if (this.food) {
      this.food.onRaf(
        time,
        hey.FSLIDER
          .parallaxValues[
          this.index
        ]
      )
    }
  }

  /*
   * ------------------------------------------------
   * VISIBILITY
   * ------------------------------------------------
   */

  handleInView = isIn => {
    if (isIn) {
      this.#visible =
        true

      this.bg.view =
        1
    } else {
      this.#visible =
        false

      this.bg.view =
        0

      if (this.#funkytl) {
        this.#funkytl.kill()

        this.food.a.ry =
          0

        this.food.a.rz =
          0

        this.food.a.centerScale =
          0

        this.food.a.centerLift =
          0
      }
    }

    if (this.food) {
      this.food.handleInView(
        isIn
      )
    }
  }

  /*
   * ------------------------------------------------
   * CENTER / SETTLE
   * ------------------------------------------------
   */

  onSettle = (
    current,
    old
  ) => {
    if (
      current === old
    )
      return

    if (
      this.index ===
      current
    ) {
      this.bg.center =
        1
    } else if (
      this.index === old
    ) {
      this.bg.center =
        0
    }
  }

  /*
   * ------------------------------------------------
   * INITIAL PAGE INTRO
   * ------------------------------------------------
   */

  animateIn = () => {
    gsap.to(
      this.food.a,
      {
        rotation: 0,

        startY: 0,

        duration: 2.4,

        ease:
          "expo.out",

        delay: () =>
          0.35 +
          [0, 1, 2, 3, 4][
            this.index
          ] *
            0.16,
      }
    )

    gsap.to(
      this.bg
        .material
        .uniforms
        .u_a_in,
      {
        value: 1,

        duration: 1.4,

        ease:
          "expo.out",

        delay: () =>
          0.6 +
          [0, 1, 2, 3, 4][
            this.index
          ] *
            0.1,
      }
    )
  }

  /*
   * ------------------------------------------------
   * CENTER MODEL MOTION
   * ------------------------------------------------
   *
   * Old behavior:
   *
   * full 360 degree spin.
   *
   * New behavior:
   *
   * tiny lift
   * tiny scale pulse
   * slight yaw
   * slight roll
   * smooth return
   */

  #funkytl = null

  animateCentral = (
    baseDuration = 2.2
  ) => {
    if (!this.food)
      return

    if (
      this.#funkytl
    ) {
      this.#funkytl.kill()
    }

    /*
     * Always start from a clean center state.
     */
    this.food.a.ry =
      0

    this.food.a.rz =
      0

    this.food.a.centerScale =
      0

    this.food.a.centerLift =
      0

    /*
     * Alternate direction slightly so
     * the animation doesn't feel robotic.
     */
    const direction =
      Math.random() >
      0.5
        ? -1
        : 1

    this.#funkytl =
      gsap.timeline()

    /*
     * Small premium "breath".
     */
    this.#funkytl.to(
      this.food.a,
      {
        centerScale:
          0.045,

        centerLift:
          0.035,

        ry:
          direction *
          0.045,

        rz:
          direction *
          -0.018,

        duration:
          0.42,

        ease:
          "power2.out",
      }
    )

    /*
     * Smooth spring-like return.
     */
    this.#funkytl.to(
      this.food.a,
      {
        centerScale:
          0,

        centerLift:
          0,

        ry: 0,

        rz: 0,

        duration:
          1.35,

        ease:
          "elastic.out(1, 0.65)",
      }
    )
  }

  /*
   * ------------------------------------------------
   * LEAVING CENTER
   * ------------------------------------------------
   */

  invalidate = () => {
    if (
      this.#funkytl
    ) {
      this.#funkytl.kill()
    }

    if (!this.food)
      return

    gsap.to(
      this.food.a,
      {
        ry: 0,

        rz: 0,

        centerScale:
          0,

        centerLift:
          0,

        duration:
          0.9,

        ease:
          "expo.out",
      }
    )
  }
}