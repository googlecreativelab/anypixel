# Anypixel app by inconvergent

forked from: https://github.com/googlecreativelab/anypixel-example

## Installation

First you will need to install the Anypixel previewer:

https://github.com/googlecreativelab/anypixel-previewer.

The in the `app` directory do:

    npm install

And then:

    preview

This should start the previewer in you default browser.

To build the app after you make changes run

    npm run build


## Configuration

All configuration is in `src/app.js`.


### General behaviour

- If the particle trails are too long/short

  - `trailTimeout`: length of trails in ms.

- If particles are too bright/not bright enough:

  When a particle "touches" a pixel,  that pixel will light up with a certain
  intensity, and gradually fade out over a series of iterations. There are two
  levels of abstraction to a particle trail. One is the stored intensity, which
  is a number between 0 and `normalizeScale`. The second is the displayed
  intensity on the display, which is a number that is either 0, or in the range
  `[lowerIntensity, 255]`.

  In effect we map `0` in the stored intensity to `0` in the displayed
  intensity, and we map the range `[1, normalizeScale]` into the range
  `[lowerIntensity, 255]`.

  In addition to `trailTimeout`, `normalizeScale` and `lowerIntensity`, you can
  adjust:

  - `fadeInc`: the number added to the stored intensity when a pixel is
    touched.
  - `fadeItt`: the number of fade out iterations. (the number of iterations it
    takes before a pixel is back to the state it had "before" it was touch by a
    particular particle)

- If particles move too slowly/quickly

  - `spd`: adjusts how far a particle moves in one step; 1 is one pixel. (this
    applies to particles spawned by user interaction.)

- If particles move too erratically

  - `vAngleStp`: adjusts how much the particle speed can change in one step.


### Logo

When the logo fades in it does so by iteratively spawning random particles
inside the logo over a series of "fade in" iterations.

- If there are too many/few particles:

  - `introNum`: adjusts how many particles spawn in each "fade in" iteration.

- If it takes too long/fades in too quickly:

  - `IntroItt`: number of fade in iterations.
  - `introDelay`: time in ms between fade in iterations

- If particles spawned in the logo move to quickly/slowly:

  - `introSpd`: speed of particles when they are spawned.

The display will go into idle state (see below) after a timeout:

- `idleTimeout`: time in ms after last interaction until the logo fades in and
  we are in an idle state.


### Idle

When the display is idle random "distraction" particles will spawn inside the
logo and head off in a random direction.

- `distractionNum`: number of particles that are spawned on each "distraction".
- `distractionDelay`: time between each "distraction". This is randomized like
  this: `Math.random()*distractionDelay`, so it is the theoretical upper bound.

## Thanks

This code was possible thanks to Google Creative Lab (in particular Ryan Burke,
Jeremy Abel and Richard The), Async.js, and Andrew J. Baker:
https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/

