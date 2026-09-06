import { SliderGroup } from "../dom/group"
import gsap from "../../gsap"

import { hey } from "../../hey"
import { Gl } from "../gl"
import { Raf } from "../../utils/subscribable"
import { Observe } from "../../modules/_/observe"
import { Bg } from "./bg/"
import { Food } from "./food"

import { SLIDER_FOOD } from "../../../content"

import { Box3, Vector3, Group } from "three"

export class Slide extends SliderGroup {
  #visible = true
  #raf = Raf.subscribe(t => this.raf(t))
  #observe = new Observe(this.element, {
    // threshold: 0.05,
    // rootMargin: "0px -0px 0px -0px",
    callback: ({ isIn }) => {
      this.handleInView(isIn)
    },
  })

  #onLoad = hey.on("WEBGL_LOADED", () => this.onLoad())
  #onStart = hey.on("START", () => this.animateIn())
  #onSlideSettle = hey.on("FSLIDE_CHANGE", ([current, old]) =>
    this.onSettle(current, old)
  )

  constructor(element, { index }) {
    super(element, { index })
    this.lib = SLIDER_FOOD[index]
    this.element = element
    this.index = index

    this.bg = new Bg(this.lib)
    this.add(this.bg)
  }

onLoad = () => {
  let model

  if (this.index === 0) {
    const source = Gl.scene.assets.controller.clone(true)

    const box = new Box3().setFromObject(source)
    const size = new Vector3()
    const center = new Vector3()

    box.getSize(size)
    box.getCenter(center)

    // حط المجسم بالنص
    source.position.x -= center.x
    source.position.y -= center.y
    source.position.z -= center.z

    // خليه بحجم مناسب للمشهد
    const maxSize = Math.max(size.x, size.y, size.z)
    const scale = 1.2 / maxSize

    const wrapper = new Group()
    wrapper.add(source)
    wrapper.scale.setScalar(scale)

    model = wrapper

    console.log("CONTROLLER SIZE:", size)
    console.log("CONTROLLER SCALE:", scale)
  } else {
    model = Gl.scene.assets.model.children.filter(
      child => child.name === this.lib.name
    )[0]
  }

  this.food = new Food(model, this.index, this.lib)
  this.add(this.food)
}

  resize() {
    this.bg.scale.set(this.bounds.width, this.bounds.height, 1)
  }

  raf = ({ time }) => {
    // if (!this.#visible) return

    this.bg.speed = hey.FSLIDER.lspeed
    this.bg.time = time * 0.4

    if (this.food) {
      this.food.onRaf(time, hey.FSLIDER.parallaxValues[this.index])
    }
  }

  /** -- Animation */
  handleInView = isIn => {
    if (isIn) {
      this.#visible = true
      this.bg.view = 1
    } else {
      this.#visible = false
      this.bg.view = 0
      if (this.#funkytl) {
        this.#funkytl.kill()
        this.food.a.ry = 0
        this.food.a.rz = 0
      }
    }

    if (this.food) {
      this.food.handleInView(isIn)
    }
  }

  onSettle = (current, old) => {
    if (current === old) return

    if (this.index === current) {
      this.bg.center = 1
    } else if (this.index === old) {
      this.bg.center = 0
    }
  }

  animateIn = () => {
    gsap.to(this.food.a, {
      rotation: 0,
      startY: 0,
      duration: 2.9,
      ease: "elastic.out(1,0.7)",
      delay: () => 0.4 + [0, 1, 2, 3, 4][this.index] * 0.2,
    })

    gsap.to(this.bg.material.uniforms.u_a_in, {
      value: 1,
      duration: 1.4,
      ease: "expo.out",
      delay: () => 0.6 + [0, 1, 2, 3, 4][this.index] * 0.1,
    })
  }

  #funkytl = null
  animateCentral = (baseDuration = 2.2) => {
    this.#funkytl = gsap.timeline({
      yoyo: true,
      repeat: 1,
    })

    this.#funkytl.to(this.food.a, {
      rz: this.food.a.rz + Math.PI * 2 * (Math.random() > 0.5 ? -1 : 1),
      duration: baseDuration,
      ease: "elastic.inOut(1,.5)",
    })

    this.#funkytl.to(
      this.food.a,
      {
        ry: Math.random() - 0.5,
        duration: baseDuration,
        ease: "elastic.inOut(1,.5)",
      },
      "<"
    )
  }

  invalidate = () => {
    if (this.#funkytl) {
      this.#funkytl.kill()
      gsap.to(this.food.a, {
        ry: 0,
        rz: 0,
        duration: 1.3,
        ease: "expo.out",
      })
    }
  }
}
