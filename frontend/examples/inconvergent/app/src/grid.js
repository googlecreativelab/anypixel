/**
 * copyright 2016 google inc.
 *
 * licensed under the apache license, version 2.0 (the "license");
 * you may not use this file except in compliance with the license.
 * you may obtain a copy of the license at
 *
 *     http://www.apache.org/licenses/license-2.0
 *
 * unless required by applicable law or agreed to in writing, software
 * distributed under the license is distributed on an "as is" basis,
 * without warranties or conditions of any kind, either express or implied.
 * see the license for the specific language governing permissions and
 * limitations under the license.
 */
'use strict';

let async = require('async')
let anypixel = require('anypixel')
let utils = require('./utils.js')


const PI = Math.PI
const PII = PI*2.0



class Particle {
  constructor(grid, x, y, dx, dy, additive, normalizeColor, config) {
    this.grid = grid
    this.x = x
    this.y = y
    this.dx = dx
    this.dy = dy
    this.additive = additive
    this.vAngleStp = config.vAngleStp

    this.id = Math.floor(Math.random()*90000000)

    this.fadeInc = config.fadeInc
    this.fadeItt = config.fadeItt
    this.s = config.trailTimeout/config.fadeItt

    this.overlapAdd = config.overlapAdd

    this.normalizeColor = normalizeColor

    this.z = this.grid.coordToIndex(x, y)


  }

  step(){
    let alpha = (1.0-2.0*Math.random())*PII
    this.dx += Math.cos(alpha) * this.vAngleStp
    this.dy += Math.sin(alpha) * this.vAngleStp
    this.x += this.dx
    this.y += this.dy

    let x = this.x
    let y = this.y
    let h = this.grid.h
    let w = this.grid.w

    if (x>w-1 || x<0 || y>h-1 || y<0){
      return false
    }

    let z = this.grid.coordToIndex(x, y)

    let inc = this.fadeInc
    let itt = this.fadeItt

    if (this.grid.fadeTimers[z]>0){
      if (this.overlapAdd>0){
        if (!this.additive && this.grid.fadeTimers[z] !== this.id){
          this.grid.intensity[z] += this.overlapAdd
        }
      }
      return true
    }

    if (this.z !== z){

      this.z = z
      this.grid.intensity[z] += inc

      if (this.grid.logo.pixelSet.has(z)){

        if (this.additive){
          // additive particle in logo (white)
          this.grid.intensity[z] = 255 // logo is either on or off
          this.selectDraw(x, y, z, false)
          return true // add
        }
        else{
          // subtractive particle in logo (color+fade to black)
          this.grid.fadeTimers[z] = this.id
          this.fade(null, x, y, z, inc/itt, true)
          return true
        }

      }

      if (!this.additive){
        // subtractive particle outside logo (color+fade to black)
        this.grid.fadeTimers[z] = this.id
        this.fade(null, x, y, z, inc/itt, true)
      }
      else{
        // additive particle outside logo (white)
        this.fade(itt, x, y, z, inc/itt, false)
      }

    }

    return true
  }

  fade(itt, x, y, z, inc, useColor) {

    if (itt===null){
      this.selectDraw(x, y, z, useColor)
      if (this.grid.intensity[z]<1){
        this.grid.fadeTimers[z] = -1
        return
      }
    }
    else{
      if (this.grid.fadeTimers[z]>0){
        return
      }
      this.selectDraw(x, y, z, useColor)
      if (itt<1){
        return
      }
      itt = itt-1
    }

    this.grid.intensity[z] -= inc

    setTimeout(() => {
      this.fade(itt, x, y, z, inc, useColor)
    }, this.s)

  }

  selectDraw(x, y, z, useColor){
    if (useColor){
      let c = this.normalizeColor(this.grid.intensity[z])
      this.grid.draw(c.r, c.g, c.b, Math.floor(x+0.5), Math.floor(y+0.5))
    }
    else{
      let i = this.grid.normalize(this.grid.intensity[z])
      this.grid.draw(i, i, i, Math.floor(x+0.5), Math.floor(y+0.5))
    }
  }

}

class Grid {
  constructor(particleConfig, info){

    this.flip = 1
    this.theta = Math.random()*PII

    this.h = anypixel.config.height
    this.w = anypixel.config.width
    this.g = this.h*this.w
    this.info = info
    this.particleConfig = particleConfig
    this.logo = new utils.Logo()

    this.ctx = anypixel.canvas.getContext2D()

    this.intensity = new Uint8ClampedArray(this.g)

    this.fadeTimers = new Int32Array(this.g)
    this.pressedTimers = new Int32Array(this.g)

    this.pressedSet = {}

    for (let i=0;i<this.g;i++){
      this.fadeTimers[i] = -1
      this.pressedTimers[i] = -1
    }

    this.particles = []

    console.log('active')
    this.passive = false
    this.setPassiveTimeout()


    this.imageData = this.ctx.getImageData(0, 0, this.w, this.h) // from https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
    this.data = this.imageData.data // from https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
    this.buf = new ArrayBuffer(this.imageData.data.length) // from https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
    this.buf8 = new Uint8ClampedArray(this.buf)  // from https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
    this.data32 = new Uint32Array(this.buf) // from https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/

    this.normalize = utils.getNormalizeIntensity(
      particleConfig.normalizeLower,
      particleConfig.normalizeScale
    )
    this.color = new utils.Color(
      particleConfig.palettes,
      utils.getNormalizeIntensity(
        particleConfig.colorLower,
        particleConfig.colorScale
      )
    )
    this.colorNormalizer = this.color.getColorNormalizer()

    this.clearGrid()

    if (particleConfig.doIntro){
      this.intro(
        this.particleConfig.introItt,
        this.particleConfig.introNum,
        this.particleConfig.introDelay,
        this.particleConfig.introSpd
      )
    }

    this.distractions()

    document.addEventListener('onButtonDown', event => {


      let x = event.detail.x
      let y = event.detail.y
      let z = this.coordToIndex(x, y)
      this.pressedSet[z] = this.color.getColorNormalizer()

      for (let i=0;i<particleConfig.spawnNum;i++){
        this.spawn(x, y, false)
        this.flip *= -1
      }

      this.spawnWrap(x,y,z)

      if (this.passive){
        this.passive = false
        console.log('active')
      }
      this.setPassiveTimeout()
    })

    document.addEventListener('onButtonUp', event => {
      let x = event.detail.x
      let y = event.detail.y
      let z = this.coordToIndex(x, y)
      delete this.pressedSet[z]
      clearTimeout(this.pressedTimers[z])
      this.draw(0, 0, 0, x, y)
    })

  }

  spawnWrap(x, y, z){
    for (let i=0;i<this.particleConfig.spawnNum;i++){
      this.spawn(x, y, false)
      this.flip *= -1
    }
    this.pressedTimers[z] = setTimeout(() => {
      this.spawnWrap(x, y, z)
    }, this.particleConfig.contSpawnTimeout)
  }

  setPassiveTimeout(){


    clearTimeout(this.passiveTimeout)

    this.passiveTimeout = setTimeout(() => {
      console.log('passive')
      this.color.nextPalette()
      this.passive = true

      if (this.particleConfig.doIntro){
        this.intro(
          this.particleConfig.introItt,
          this.particleConfig.introNum,
          this.particleConfig.introDelay,
          this.particleConfig.introSpd
        )
      }
    }, this.particleConfig.idleTimeout)

  }

  distractions(){

    let spd = this.particleConfig.spd
    let s = this.particleConfig.distractionDelay

    let num = this.particleConfig.distractionNumHigh

    if (this.passive){
      num = this.particleConfig.distractionNumLow
    }

    this.logo.randomSample(num).forEach(k => {
      let co = this.indexToCoord(k)
      let theta = Math.random()*PII
      this.vspawn(
        co.x,
        co.y,
        Math.cos(theta)*spd,
        Math.sin(theta)*spd,
        true
      )
    })
    setTimeout(() => {
      this.distractions()
    }, s*Math.random())
  }

  intro(itt, num, s, spd){

    this.flip *= -1

    this.logo.randomSample(num).forEach(k => {
      let co = this.indexToCoord(k)
      this.spawn(
        co.x,
        co.y,
        true
      )
    })

    if (itt>1){
      setTimeout(() => {
        this.intro(itt-1, num, s, spd)
      }, s)
    }
    else{
      this.logo.pixels.forEach(k => {
        let co = this.indexToCoord(k)
        this.draw(255,255,255,co.x, co.y)
      })
    }

  }

  /* jshint ignore:start */
  draw(r, g, b, x, y){
    this.data32[y * this.w + x] = // from https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
      (255 << 24) | // alpha
      (b << 16) | // blue
      (g << 8) | // green
       r // red
  }
  /* jshint ignore:end */

  coordToIndex(x, y){
    return Math.floor(y+0.5)*this.w + Math.floor(x+0.5)
  }

  indexToCoord(k){
    let x = k%this.w
    return {
      x: x,
      y: (k-x)/this.w
    }
  }

  updateGrid(){

    Object.keys(this.pressedSet).forEach(z => {
      let rgb = this.pressedSet[z](255)
      let co = this.indexToCoord(z)
      this.draw(rgb.r, rgb.g, rgb.b, co.x, co.y)
    })

    this.imageData.data.set(this.buf8) // from https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
    this.ctx.putImageData(this.imageData, 0, 0); // from https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
  }

  clearGrid(){
    let c = (255 << 24) | (0 << 16) | (0 << 8) | 0 // from https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
    for (let i=0;i<this.g;i++){
      this.intensity[i] = 0
      this.data32[i] = c
    }
  }

  spawn(x, y, additive){
    let theta = this.theta
    let spd = this.particleConfig.spd*this.flip
    this.particles.push(new Particle(
      this,
      x,
      y,
      Math.cos(theta)*spd,
      Math.sin(theta)*spd,
      additive,
      this.color.getColorNormalizer(),
      this.particleConfig
    ))
  }

  vspawn(x, y, dx, dy, additive){
    this.particles.push(new Particle(
      this,
      x,
      y,
      dx,
      dy,
      additive,
      this.color.getColorNormalizer(),
      this.particleConfig
    ))
  }

  step(){
    async.filter(this.particles, (a, callback) => {
      callback(a.step())
    }, particles => {
      this.particles = particles
    })

    this.updateGrid()

    this.theta += (1.0-2.0*Math.random())*this.particleConfig.angleStp
  }

}

module.exports = {
  Grid: Grid
}

