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

var config = require('../../config/config.display');

/**
 * The render canvas is the canvas that renders the display units. It is the same size as the 
 * physical display, and is enlarged by the display canvas so the user can see it.
 */
var renderCanvas = module.exports = {};

/**
 * Creates the render canvas
 */
renderCanvas.init = function() {
  renderCanvas.el = document.createElement('canvas');
  renderCanvas.el.width = config.cols;
  renderCanvas.el.height = config.rows;
  renderCanvas.ctx = renderCanvas.el.getContext('2d');
}

/**
 * Draws a given ImageData object at a given unit row and column
 */
renderCanvas.render = function(imageData, row, col) {
  if (imageData) {
    renderCanvas.ctx.putImageData(imageData, col * imageData.width, row * imageData.height);
  }
}