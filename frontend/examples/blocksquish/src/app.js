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

var anypixel = require('anypixel');
var config = anypixel.config;
var SpringRectLayout = require('./spring-rect-layout');
var SpringLetter = require('./spring-letter');

var ctx = anypixel.canvas.getContext2D();
ctx.imageSmoothingEnabled = false;

var rectLayout = new SpringRectLayout();

/**
 * Event listener for DOMContentLoaded. Initializes the SpringRectLayout with rectangles which are
 * sized to each letter in the Google logo. The letters are entirely rectangular, with 1px lines
 * used to define the lines of the letters themselves. These lines are are defined as coordinates
 * on a 140x42 grid.
 */
document.addEventListener('DOMContentLoaded', function() {
	// G
	rectLayout.rects.push(new SpringLetter(0, 28, '#4285F4', [
		[ [13, 10], [13, 30] ],
		[ [13, 21], [28, 21] ],
		[ [13, 30], [21, 30] ]
	]));

	// O
	rectLayout.rects.push(new SpringLetter(1, 22, '#FF0000', [
		[ [11, 16], [11, 27] ]
	]));

	// O
	rectLayout.rects.push(new SpringLetter(2, 22, '#FBBC05', [
		[ [11, 16], [11, 27] ]
	]));

	// G
	rectLayout.rects.push(new SpringLetter(3, 22, '#4285F4', [
		[ [11, 10], [11, 30] ],
		[ [11, 21], [28, 21] ],
		[ [11, 30], [17, 30] ]
	]));

	// L
	rectLayout.rects.push(new SpringLetter(4, 18, '#34A853', [
		[ [17, 0 ], [17, 22] ]
	]));

	// E
	rectLayout.rects.push(new SpringLetter(5, 26, '#FF0000', [
		[ [12, 13], [26, 13] ],
		[ [12, 28], [26, 28] ]
	]));

	rectLayout.init();

	window.requestAnimationFrame(update);
}, false);

/**
 * Event listener for buttonDown events. Triggers the rectangle that contains the pushed button.
 */
document.addEventListener('onButtonDown', function(e) {
	rectLayout.rects.forEach(function(rect) {
		if (rect.isIdleActive) {
			rect.reset();
		}
	});

	if (targetRect = rectLayout.hitTest(e.detail)) {
		targetRect.onButtonDown(e.detail);
	}
});

/**
 * Event listener for buttonUp events. Resets any rectangles that no longer have pushed buttons 
 * within their boundaries.
 */
document.addEventListener('onButtonUp', function(e) {
	rectLayout.rects.forEach(function(rect) {
		rect.onButtonUp(e.detail);
	});
});

/**
 * Draws the each rectangle in the layout, and plots any lines associated with them.
 */
function update(t) {
	rectLayout.update();

	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, config.width, config.height);

	var widthSum = 0;
	rectLayout.rects.forEach(function(letter, i) {
		ctx.fillStyle = letter.color;
		ctx.fillRect(widthSum, 
			Math.round(letter.getYOffset()), 
			letter.getWidth(),
			Math.round(letter.getHeight()));

		// Draw letter feature lines
		ctx.fillStyle = '#000';
		letter.getLines().forEach(function(line) {
			var w = Math.max(1, line[1][0] - line[0][0]);
			var h = Math.max(1, line[1][1] - line[0][1]);
			var x = widthSum + line[0][0];
			var y = Math.round(letter.getYOffset()) + line[0][1];

			// Special case for the L, who's line lies on its right edge.
			if (i == 4) {
				x = widthSum + Math.round(letter.getWidth()) - 1;
			}

			ctx.fillRect(x, y, w, h);
		});


		letter.xOffset = widthSum;
		widthSum += Math.round(letter.getWidth()) + 1;
	});

	window.requestAnimationFrame(update);
}