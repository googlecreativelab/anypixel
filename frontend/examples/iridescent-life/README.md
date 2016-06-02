# Script animation + Fluid Sim + Conway's Game of Life

This is a [Bezier spline](https://en.wikipedia.org/wiki/B-spline) script drawing animation that writes the Google letters mixed with an implementation of [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life) and a fluid simulation in WebGL shader code for Google's Anypixel display.

Press one or more buttons to inflate a blob around them. Within the outline, new button press events add to the fluid simulation and liquify the backdrop of the script drawing animation.

The interaction with the Game of Life layer starts on button up. Press multiple buttons, hold the pattern, and release all at the same time. Can you enter a simple glider and send it running away?

□&nbsp;&nbsp;&nbsp;&nbsp;□&nbsp;&nbsp;&nbsp;&nbsp;□&nbsp;&nbsp;&nbsp;&nbsp;□&nbsp;&nbsp;&nbsp;&nbsp;□  
□&nbsp;&nbsp;&nbsp;&nbsp;■&nbsp;&nbsp;&nbsp;&nbsp;■&nbsp;&nbsp;&nbsp;&nbsp;■&nbsp;&nbsp;&nbsp;&nbsp;□  
□&nbsp;&nbsp;&nbsp;&nbsp;■&nbsp;&nbsp;&nbsp;&nbsp;□&nbsp;&nbsp;&nbsp;&nbsp;□&nbsp;&nbsp;&nbsp;&nbsp;□  
□&nbsp;&nbsp;&nbsp;&nbsp;□&nbsp;&nbsp;&nbsp;&nbsp;■&nbsp;&nbsp;&nbsp;&nbsp;□&nbsp;&nbsp;&nbsp;&nbsp;□  
□&nbsp;&nbsp;&nbsp;&nbsp;□&nbsp;&nbsp;&nbsp;&nbsp;□&nbsp;&nbsp;&nbsp;&nbsp;□&nbsp;&nbsp;&nbsp;&nbsp;□  

The fluid simulation shader code was originally written by Evgeny Demidov. See [this link](https://www.ibiblio.org/e-notes/webgl/gpu/fluid.htm) for a more detailed description and an interactive demonstration.

For the blur algorithm that was used, see [ShaderLesson5](https://github.com/mattdesl/lwjgl-basics/wiki/ShaderLesson5) by [Matt DesLauriers](https://twitter.com/mattdesl).

Read more about the spline drawing animation here: [How to move an object along a particular path](http://stackoverflow.com/a/17096947/6036193)

run with the [Anypixel-Previewer](https://github.com/googlecreativelab/anypixel-previewer). In the app's root directory, do:
```sh   
preview
```
build
```sh
npm install
```
or 
```sh
npm run build
```
