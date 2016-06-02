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

let palettes = [
  [ // bluered
    [0, 170, 255],
    [128, 201, 255],
    [170, 8, 0],
    [255, 0, 0]
  ],
  [ // reds
    [255, 0, 0],
    [255, 72, 0],
    [255, 0, 201]
  ],
  [ // greens
    [0, 89, 60],
    [36, 186, 4],
    [255, 248, 0],
    [0, 255, 255]
  ],
  [ // vintage
    [0, 170, 255],
    [196, 16, 2],
    [255, 72, 0],
    [255, 188, 0]
  ],
  [ //turquoisepurple
    [33, 7, 221],
    [255, 0, 201],
    [0, 181, 252],
    [0, 255, 255]
  ]
]


function main(){

  let Grid = require('./grid').Grid
  let utils = require('./utils')

  const DEBUG = true;

  // See README.md for a better explanation of these parameters

  let particleConfig = {
    trailTimeout: 2*130, // trail is this long (ms)

    vAngleStp: 0.01, // +/- this in radians, particle velocity
    spd: 0.2, // 1.0 is one pix per time step

    fadeInc: 180, // total brighness on tip of a particle
    fadeItt: 1, // number of fade out steps in the particle trail. must have fadeInc % fadeItt === 0

    // particle instensity is mapped linearly so that so that
    //
    // particle intensity 0 -> brightness: 0
    // particle intensity: [1, normalizeScale] -> display brightness [normalizeLower, 255]

    normalizeLower: 192,
    normalizeScale: 160,

    // these work similarly to normalizeLower and normalizeScale, but they are
    // only applied to coloured pixels
    colorLower: 192,
    colorScale: 160,

    spawnNum: 2, // spawn this number on click. TODO: randomize?

    // if this is false the only thin the idle setting does is control how
    // frequently the palette change
    doIntro: false,

    introSpd: 0.2, // speed of particles that spawn in logo
    introNum: 150, // number of particles to spawn in logo on each itt
    introItt: 5, // number of intro itterations. (total spawns: intrNum*introItt)
    introDelay: 64, // time (ms) between each intro itt

    idleTimeout: 8000, // time before display respawns logo after last interaction (idle mode)

    contSpawnTimeout: 300, // time before new particles spawn when key is held down

    // if doIntro is false distractionNum should be ~50, othwerwise it should
    // be ~10
    distractionDelay: 2000, // time (ms) between each distraction run (randomized)
    distractionNumHigh: 40, // number of particles to spawn in logo on distraction run (idle mode)
    distractionNumLow: 10, // number of particles to spawn in logo on distraction run (idle mode)

    angleStp: 0.2, // +/- this in radians

    // interaction particles will add this value to intensity when they pass
    // through each other. try values like fadeInc/fadeItt/2
    overlapAdd: 0,

    palettes: palettes
  }

  let info = {
    i: 0,
    update: 200,
    time: new Date(),
    debug: DEBUG
  }

  console.log('particle', particleConfig)

  console.log('make grid')
  let G = new Grid(
    particleConfig,
    info
  )

  console.log('start animation loop')
  utils.animation(G, info)
}

document.addEventListener('DOMContentLoaded',
  () => main()
)

