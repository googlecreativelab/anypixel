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

var config = require('anypixel').config;

/**
 * Provides functions for emulating the color properties of the LEDs on the buttonboard
 */
var colorEmulation = module.exports = {};

var resultsCanvas = document.createElement('canvas');
var resultsContext = resultsCanvas.getContext('2d');
resultsCanvas.width = config.width;
resultsCanvas.height = config.height;

var imgData = resultsContext.createImageData(1, 1);
var newPixelData = imgData.data;

/**
 * Filters a given canvas to simulate the look of LEDs on the buttonwall. Returns a copy of the
 * original canvas. The original canvas is not modified.
 */
colorEmulation.filter = function(canvas) {
	resultsContext.drawImage(canvas, 0, 0);
	var data = resultsContext.getImageData(0, 0, canvas.width, canvas.height).data;

	// Filter every pixel
	for (var i = 0, l = data.length; i < l; i += 4) {
		var r = data[i];
		var g = data[i + 1];
		var b = data[i + 2];
		var y = Math.floor((i / 4) / canvas.width);
		var x = Math.floor((i / 4) - y * canvas.width);
		var hsv = rgbToHSV(r / 255, g / 255, b / 255);

		// When a button is off, it appears to be the same grey color as the wall itself.
		// As the LED brightness increases, the perceived color gets brighter as well,
		// and the color gets more saturated. We mimic this by keeping the saturation low
		// if the brightness is low, and by capping the minimum brightness at 60%. So
		// black becomes saturation 0%, value 60% (a 60% grey), while colors with 100%
		// value are unchanged, and everything in between is scaled appropriately. Live
		// testing on the wall suggests that this is a good (though not perfect)
		// approximation to reality.
		hsv.s *= hsv.v;
		hsv.v = 0.6 + 0.4 * hsv.v;

		var rgb = hsvToRGB(hsv.h, hsv.s, hsv.v);
		newPixelData[0] = rgb.r;
		newPixelData[1] = rgb.g;
		newPixelData[2] = rgb.b;
		newPixelData[3] = 255;

		resultsContext.putImageData(imgData, x, y);
	}

	return resultsCanvas;
}

/**
 * Converts an RGB color to HSV colorspace
 * Incorporates code from https://github.com/bgrins/TinyColor
 */
function rgbToHSV(r, g, b) {
	var max = Math.max(r, g, b), min = Math.min(r, g, b);
	var h, s, v = max;

  var d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max == min) {
    h = 0;
  } else {
    switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h, s: s, v: v };
}

/**
 * Converts an HSV color to RGB colorspace
 * Incorporates code from https://github.com/bgrins/TinyColor
 */
function hsvToRGB(h, s, v) {
  h *= 6;

  var i = Math.floor(h),
      f = h - i,
      p = v * (1 - s),
      q = v * (1 - f * s),
      t = v * (1 - (1 - f) * s),
      mod = i % 6,
      r = [v, q, p, p, t, v][mod],
      g = [t, v, v, q, p, p][mod],
      b = [p, p, t, v, v, q][mod];

  return { r: r * 255, g: g * 255, b: b * 255 };
}
