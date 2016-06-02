/*
Copyright 2016 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var anypixel = require('anypixel');
var canvas = anypixel.canvas;
var ctx = canvas.getContext2D();
canvasData = ctx.createImageData(140, 42);

//A function that manipulates the array of pixel colour data created above using createImageData()
function setPixel(x, y, r, g, b, a){
  var index = (x + y * canvasData.width) * 4;

  canvasData.data[index] = r;
  canvasData.data[index + 1] = g;
  canvasData.data[index + 2] = b;
  canvasData.data[index + 3] = a;
}

window.requestAnimationFrame(mainLoop);

function mainLoop(){
  // Looping through all the colour data and changing each pixel to a random colour at a random coordinate, using the setPixel function defined earlier
  for(i = 0; i < canvasData.data.length / 4; i++) {
    var red = Math.floor(Math.random() * 256);
    var green = Math.floor(Math.random() * 256);
    var blue = Math.floor(Math.random() * 256);
    var randX = Math.floor(Math.random() * 140);
    var randY = Math.floor(Math.random() * 42);

    setPixel(randX, randY, red, green, blue, 255);
  }

  // Place the image data we created and manipulated onto the canvas
  ctx.putImageData(canvasData, 0, 0);

  //And then do it all again...
  window.requestAnimationFrame(mainLoop);
}