import { Group, MeshBasicMaterial } from "three"
import { WiggleBone } from "wiggle"
import { Raf } from "../../../utils/subscribable"
import { hey } from "../../../hey"
import gsap from "../../../gsap"
import { Mouse } from "../../../mouse"

const rand = (ind = 0) =>
  ind % 2 === 0 ? Math.random() + 0.5 : -Math.random() - 0.5

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

export class Food extends Group {
  renderOrder = 10

  _bones = []
  _root = null

  a = {
    scale: 0,

    rotation: Math.random() < 0.5 ? 5 : -6,

    /* rotation controlled by center animation */
    ry: 0,
    rz: 0,

    /* position */
    startY: 0,
    y: 0,
    z: 0,

    /* small center emphasis */
    centerScale: 0,
    centerLift: 0,

    randoms: [0, 0, 0],

    base: {
      rot: [rand(), rand(), rand()],
    },
  }

  constructor(model, index, lib) {
    super()

    this.model = model
    this.index = index
    this.lib = lib

    this.globDirection =
      this.index % 2 === 0 ? 1 : -1

    this.a.randoms.forEach((_, i) => {
      this.a.randoms[i] = rand(this.index)
    })

    this.a.startY =
      this.index % 2 === 0 ? 3 : -3

    this.onLoad()
  }

  onLoad() {
    this.model.traverse(child => {
      if (child.isSkinnedMesh) {
        child.skeleton.bones.forEach(bone => {
          if (!bone.parent.isBone && !this._root) {
            this._root = bone
          } else {
            const wiggleBone = new WiggleBone(bone, {
              velocity: this.lib.wiggle * 1.3,
            })

            this._bones.push(wiggleBone)
          }
        })
      }
    })

    this.add(this.model)
  }

  onRaf = (time, parallax) => {
    if (!this.model) return

    /*
     * ------------------------------------------------
     * SCALE / DEPTH
     * ------------------------------------------------
     */

    const distanceScale =
      this.a.scale -
      Math.abs(parallax) * 0.7 +
      0.1 +
      this.a.centerScale

    const scale = Math.max(0.72, distanceScale)

    this.scale.set(scale, scale, scale)

    /*
     * ------------------------------------------------
     * PREMIUM IDLE MOTION
     * ------------------------------------------------
     *
     * Very slow movement.
     * No automatic 360 rotation.
     */

    const idlePhase =
      time * 0.48 + this.index * 0.9

    /*
     * Tiny floating movement.
     */
    const idleFloat =
      Math.sin(time * 0.85 + this.index) * 0.028

    /*
     * About +/- 3 degrees.
     */
    const idleYaw =
      Math.sin(idlePhase) * 0.052

    /*
     * About +/- 1 degree.
     */
    const idleRoll =
      Math.sin(idlePhase * 0.73) * 0.018

    /*
     * ------------------------------------------------
     * DRAG INERTIA
     * ------------------------------------------------
     */

    const speed = hey.FSLIDER.lspeed

    /*
     * Limit the tilt so fast dragging never
     * makes the model flip or look broken.
     *
     * Maximum roughly +/- 9 degrees.
     */
    const dragTilt = clamp(
      speed * 0.12,
      -0.16,
      0.16
    )

    /*
     * Smaller yaw reaction.
     */
    const dragYaw = clamp(
      speed * -0.055,
      -0.09,
      0.09
    )

    /*
     * ------------------------------------------------
     * MOUSE PARALLAX
     * ------------------------------------------------
     *
     * Intentionally very subtle.
     */

    const mouseYaw =
      Mouse.sex *
      this.globDirection *
      0.035

    const mousePitch =
      Mouse.sey *
      this.globDirection *
      0.025

    /*
     * ------------------------------------------------
     * POSITION
     * ------------------------------------------------
     */

    this.position.y =
      this.a.startY +
      idleFloat +
      this.a.centerLift

    /*
     * ------------------------------------------------
     * SKINNED MODEL
     * ------------------------------------------------
     */

    if (this._root) {
      this._bones.forEach(bone => {
        bone.update(
          Raf.deltaTime * 1000
        )
      })

      this._root.position.z =
        Math.sin(idlePhase) * 0.08 +
        this.a.z

      this._root.position.x =
        Math.sin(idlePhase * 0.7) * 0.025

      this._root.rotation.y =
        this.a.rotation +
        this.a.ry +
        idleYaw +
        dragYaw +
        mouseYaw

      this._root.rotation.z =
        this.a.rotation +
        this.a.rz +
        idleRoll +
        dragTilt

      this._root.rotation.x =
        mousePitch
    }

    /*
     * ------------------------------------------------
     * NORMAL GLB MODEL
     * ------------------------------------------------
     */

    else {
      const [
        baseX,
        baseY,
        baseZ,
      ] = this.lib.rot ?? [0, 0, 0]

      this.model.rotation.set(
        /*
         * Slight vertical mouse reaction.
         */
        baseX + mousePitch,

        /*
         * Slow idle yaw + drag response.
         */
        baseY +
          this.a.ry +
          idleYaw +
          dragYaw +
          mouseYaw,

        /*
         * Small roll + inertia tilt.
         */
        baseZ +
          this.a.rz +
          idleRoll +
          dragTilt
      )
    }
  }

  #anim = null

  handleInView = isIn => {
    if (isIn) {
      if (this.#anim) {
        this.#anim.kill()
      }

      this.#anim = gsap.to(this.a, {
        scale: 1.2,

        duration: 1.2,

        delay:
          0.1 +
          Math.random() * 0.2,

        ease: "expo.out",
      })
    } else {
      if (this.#anim) {
        this.#anim.kill()
      }

      this.#anim = gsap.to(this.a, {
        scale: 0.8,

        duration: 0.8,

        ease: "expo.out",
      })
    }
  }
}

export function setMaterial(child) {
  if (child.isMesh) {
    const map = child.material.map

    child.material =
      new MeshBasicMaterial({
        map,
      })
  }
}