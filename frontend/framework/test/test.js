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

var anypixel = require('../lib/anypixel');

/** 
 * Demo which generates a random color for each pixel every frame, as fast as possible.
 * Useful for stress testing (and seizures, be careful!).
 */

var ctx = anypixel.canvas.getContext2D();
var imgData = ctx.createImageData(1, 1);
var data = imgData.data;

document.addEventListener('DOMContentLoaded', function() {
	window.requestAnimationFrame(update);
});

function update(t) {
	for (var y = 0; y < anypixel.config.height; y++) {
		for (var x = 0; x < anypixel.config.width; x++) {
			data[0] = Math.random() * 255;
			data[1] = Math.random() * 255;
			data[2] = Math.random() * 255;
			data[3] = 255;
			ctx.putImageData(imgData, x, y);
		}
	}

	window.requestAnimationFrame(update);
}