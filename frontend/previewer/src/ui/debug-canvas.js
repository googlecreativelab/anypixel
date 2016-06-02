/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/license-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the license.
 */

'use strict';
var config = require('anypixel').config;

/**
 * Provides a drawing canavs for debugging. Currently used for displaying the contents of the 
 * input stateMap.
 */
var DebugCanvas = module.exports = function() {
	this.canvas = document.createElement('canvas');
	this.canvas.width = config.width;
	this.canvas.height = config.height;

	this.ctx = this.canvas.getContext('2d');
	this.ctx.imageSmoothingEnabled = false;

	this.imageData = this.ctx.createImageData(1, 1);
	this.pixelData = this.imageData.data;
}

/**
 * Adds or removes a pixel from the canvas at a given position
 */
DebugCanvas.prototype.plot = function(position, state) {
	this.pixelData[0] = 0;
	this.pixelData[1] = 0;
	this.pixelData[2] = 0;
	this.pixelData[3] = state ? 255 : 0;
	this.ctx.putImageData(this.imageData, position.x, position.y);
}

/**
 * Returns the canvas
 */
DebugCanvas.prototype.getCanvas = function() {
	return this.canvas;
}