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
var idleTimer = require('./idle-timer');

var ctx = anypixel.canvas.getContext2D();
ctx.imageSmoothingEnabled = false;

var rectLayout = new SpringRectLayout();
var restoreSizeTimer = null; 

var lockupImage = new Image();

/**
 * Event listener for DOMContentLoaded. Initializes the SpringRectLayout with rectangles which are
 * sized to each letter in the Google logo. Empty spacing rectangles are inserted between each 
 * letter to maintain even spacing even when the size of an individual letter changes. Spacing 
 * rectangles are also added at the left and right edges in order to center the logo in the display.
 *
 * The rectangles are added in left-to-right order, but when the demo starts, they are animated from
 * the center outwards. This as indicated by the first parameter of each letter, which determines 
 * the animation order. The left and right endcap spacers are animated at the same time as the 
 * center letter element (the second O) in order to keep the entire assembly centered.
 */
document.addEventListener('DOMContentLoaded', function() {

	// G
	rectLayout.addRect(0, 200, 0);
	rectLayout.addRect(2, 247.72, 20.000, 300, 800, 'img/logo_00.svg');
	rectLayout.addRect(2, 11.27, 0);

	// O
	rectLayout.addRect(1, 164.07, 90.626, 300, 800, 'img/logo_01.svg');

	// O
	rectLayout.addRect(0, 14.51, 0);
	rectLayout.addRect(0, 164.07, 90.626, 300, 800, 'img/logo_02.svg');
	rectLayout.addRect(0, 14.787, 0);

	// G
	rectLayout.addRect(1, 156.699, 90.712, 300, 800, 'img/logo_03.svg');
	rectLayout.addRect(1, 23.865, 0);

	// L - it looks strange when scaled as large as the other letters, so it has a reduced min 
	// and max width. The L is also animated at the same time as the G in order to compensate for
	// the fact that there's no center element in a set of 6 elements.
	rectLayout.addRect(1, 35.975, 28.447, 200, 300, 'img/logo_04.svg');	
	
	// E
	rectLayout.addRect(2, 16.238, 0);
	rectLayout.addRect(2, 149.797, 90.517, 300, 800, 'img/logo_05.svg');
	rectLayout.addRect(0, 200, 0);

	// The lockup image is a hand-tuned version of the logo in the resting state, which gives the best
	// visual reproduction for when the logo is seen undistorted.
	lockupImage.src = 'img/lockup.png';

	window.requestAnimationFrame(update);
}, false);

/**
 * Event listener for buttonDown events. Expands the rectangle that contains the pushed button.
 */
document.addEventListener('onButtonDown', function(e) {
	idleTimer.clear();

	var targetRect = rectLayout.hitTest(e.detail);

	// Change target to the left or right rectangle if the button event occurs on a space rectangle.
	if (targetRect.isSpace) {
		var index = rectLayout.rects.indexOf(targetRect);
		if (e.detail.x > anypixel.config.width / 2) {
			targetRect = rectLayout.rects[index - 1];
		} else {
			targetRect = rectLayout.rects[index + 1];
		}
	}

	if (targetRect && !targetRect.isSpace && !targetRect.isHeld) {
		rectLayout.expandRect(targetRect);

		// Reset the timer to maintain the interactive state
		if (restoreSizeTimer) {
			window.clearTimeout(restoreSizeTimer);
		}
	}		
});

/**
 * Event listener for buttonUp events. Resets any rectangles that no longer have pushed buttons 
 * within their boundaries.
 */
document.addEventListener('onButtonUp', function(e) {
	var isAnyRectActive = false;

	// Reset the rectangle, but only if no other buttons are pushed within it.
	rectLayout.rects.forEach(function(rect, i) {
		var isStillHeld = false;

		for (var key in anypixel.events.pushedButtons) {
			var button = anypixel.events.pushedButtons[key];
			if (rect.isActive && rect.isHeld && rect.hitTest(button)) {
				isStillHeld = true;
				isAnyRectActive = true;
			}
		}

		if (!isStillHeld) {
			rect.setHeld(false);
		}
	});

	if (restoreSizeTimer) {
		window.clearTimeout(restoreSizeTimer);
	}

	// Set a timer to restore rectangle sizes and positions
	if (!isAnyRectActive) {
		restoreSizeTimer = window.setTimeout(function() {
			rectLayout.rects.forEach(function(rect) {
				rect.reset();
			});
		}, 2000);
	}
});

/**
 * Draws the images associated with each rectangle in the layout
 */
function update(t) {
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, config.width, config.height);

	rectLayout.update();

	var x = 0;
	var isAtRest = true;
	rectLayout.rects.forEach(function(rect, i) {
		var w = rect.getWidth();
		var y = ((rect.getYOffset() + 30) / 347.522) * config.height;
		rect.xOffset = x;
			
		if (rect.loadedSVG && rect.svgImage) {
			ctx.drawImage(rect.svgImage, x, y, w, w * rect.svgAspectRatio);
		}

		if (!rect.isAtRest(0.06) || rect.isActive || rect.isActiveIdle || !rect.firstUpdate) {
			isAtRest = false;
		}

		x += rect.getWidth();
	});

	// Draw the dedicated lockup image if every rectangle is in the rest state
	if (isAtRest && lockupImage.complete) {
		ctx.drawImage(lockupImage, 0, 0);
	}

	window.requestAnimationFrame(update);
}
