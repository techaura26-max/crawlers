import { hey } from "../hey"
import gsap from "../gsap"

export class Loader {
  element: HTMLDivElement
  svg: HTMLElement | SVGElement
  circle: SVGElement
  #onLoad = hey.on("START", () => this.animateIn())

  constructor(element: HTMLDivElement) {
    // console.log("loader", element)
    this.element = element
    this.circle = window.app.loader.circle
    this.svg = this.circle.parentElement
  }

  animateIn = () => {
    window.app.loader.timeouts.forEach(timeout => clearTimeout(timeout))

    this.circle.style.transitionDuration = ".4s"
    this.circle.style.transitionDelay = "0s"
    this.circle.style.strokeDashoffset = "0px"

    gsap.to(this.svg, {
      scale: 0,
      opacity: 0,
      duration: 0.65,
      delay: 0.2,
      ease: "power2.inOut",
    })

    gsap.to(this.element.querySelector("[data-loader-copy]"), {
      y: -12,
      opacity: 0,
      duration: 0.55,
      delay: 0.18,
      ease: "power2.inOut",
    })

    gsap.to(this.element, {
      autoAlpha: 0,
      duration: 0.7,
      delay: 0.45,
      ease: "power2.inOut",
      onComplete: () => {
        this.element.remove()
      },
    })
  }
}
