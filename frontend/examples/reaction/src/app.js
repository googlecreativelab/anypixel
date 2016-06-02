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
var glUtils = require('./gl-utils');
var shaders = require('./shaders');
var circles = require('./expanding-circles');
var idleTimer = require('./idle-timer');

require('./math');

// The GL context
var gl;

// Framebuffers and textures used to render framebuffers
var fbo1, fbo2;
var tex1, tex2;

// Texture dimensions
var sizeX = Math.nearestPow2(anypixel.config.width),
		sizeY = Math.nearestPow2(anypixel.config.height);

// Shader programs
var progReaction, progScreen;

var feedChange = 0.0, killChange = 0.0, logoChange = 0.0;
var changeLimit = 0.00005;

// The feed and kill values that are cycled through according to provided timing intervals
var fkModes = [
	{ f: 0.022, k: 0.055, g: 600, idle: 30000 },
	{ f: 0.014, k: 0.042, g: 900, idle: 30000 },
	{ f: 0.011, k: 0.042, g: 600, idle: 30000 },
	{ f: 0.030, k: 0.057, g: 600, idle: 10000 }
];

var currentMode = 0;
var atInitialState = false;
var initialStateButtons = [];

// Uniforms for the reaction shader
var reactionUniforms = {
	tSource: {type: 't', value: 0},
	tBrush: {type: 't', value: 1},
	tButtons: {type: 't', value: 2},
	tCircles: {type: 't', value: 3},
	screenWidth: {type: '1f', value: sizeX},
	screenHeight: {type: '1f', value: sizeY},
	delta: {type: '1f', value: 1.0},
	feed: {type: '1f', value: fkModes[currentMode].f},
	kill: {type: '1f', value: fkModes[currentMode].k},
	rateA: {type: '1f', value: 0.2097},
	rateB: {type: '1f', value: 0.105},
	logoAmount: {type: '1f', value: fkModes[currentMode].g},
	addLogoPre: {type: '1f', value: 1.0},
	addLogoPost: {type: '1f', value: 0.0},
	reset: {type: '1f', value: 0.0}
};

// Uniforms for the screen shader
var screenUniforms = {
	tSource: {type: 't', value: 0},
	tButtons: {type: 't', value: 1}
};

var lastTime = 0;
var useSecondBuffer = false;

var logoTex, eventTex, circleTex;
var eventCanvas, eventContext;
var logoImage = new Image();

/**
 * Event listener for DOMContentLoaded. Sets up the initial reaction state.
 */
document.addEventListener('DOMContentLoaded', function() {
	gl = anypixel.canvas.getContext3D();

	// Enable floating point textures
	gl.getExtension('OES_texture_float');
	gl.getExtension('OES_texture_float_linear');

	// Create shader programs
	progReaction = glUtils.createAndLinkProgram(gl, shaders.standardVert, shaders.reactionFrag);
	progScreen = glUtils.createAndLinkProgram(gl, shaders.standardVert, shaders.standardFrag);

	// Prepare the rendering surface
	glUtils.prepareSurface(gl, progScreen, 'aPos', 'aTexCoord');

	// Create framebuffer textures and initialize them with empty pixels
	var glPixels;
	glPixels = new Float32Array(glUtils.getEmptyPixelArray(sizeX, sizeY));
	fbo1 = gl.createFramebuffer();
	tex1 = glUtils.createAndBindTexture(gl, glPixels, sizeX, sizeY, fbo1, {formatType: gl.FLOAT});

	glPixels = new Float32Array(glUtils.getEmptyPixelArray(sizeX, sizeY));
	fbo2 = gl.createFramebuffer();
	tex2 = glUtils.createAndBindTexture(gl, glPixels, sizeX, sizeY, fbo2, {formatType: gl.FLOAT});

	// Create canvas for sending event information to the GPU
	eventCanvas = document.createElement('canvas');
	eventCanvas.width = sizeX;
	eventCanvas.height = sizeY;
	eventContext = eventCanvas.getContext('2d');
	eventContext.fillStyle = '#000';
	eventContext.fillRect(0, 0, sizeX, sizeY);

	eventTex = glUtils.createTextureFromImage(gl, eventCanvas);
	circleTex = glUtils.createTextureFromImage(gl, circles.getCanvas());

	// Load the logo image from base64 data
	logoImage.onload = onImageLoadComplete;
	logoImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAABACAMAAADCg1mMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////AAAAVcLTfgAAAWlJREFUeNrs2u2uwiAMBuD2/m/amGjioGW6vW2Kffl1wtDQ5/BRcKLNixCAAAQgAAEIQAACEIAABCAAAe5+2bP0BZB36QggY4H3M8pVQsLHE5QGmAJuBmCF22oKpKx7dQGS1v3aAEqAvgBZiU9VgC/j97IDp95IKD6aYDONFAAnQfLyJlkBoHMtOIDZ98Of8/5xCGesNgCQsy8JwPiAU62u0Si4C4Axvn+vVuMxZhbErQGvR2MLJ9JF8wFASwEsBJyI9CbAtDqUTYTOAfTSCBDj+NkLAJt7xR2GgqYAOiUErCJmn+xNELEIom9agi5E3HwFtw1WuxIT747M2bu9NstEaHxaA8DKZe39+v9SYe8AI2GHIfRpCDejlh07Ow7rleOwaCmAzS5CCFAXQFJv3KTg/zxzANQDcFOIRiMg9GfmHRbBzPiL7gKJr1pU3QbT3jThS1IEIAABCEAAAhCAAAQgAAEI0LE8BBgAXKc8LH0XtxMAAAAASUVORK5CYII=';

	// Seed the starting state with simulated button events
	for (var i = 1; i < 11; i++) {
		var ms = i * 250;
		setTimeout(function() {
			var x = Math.floor(Math.random() * anypixel.config.width);
			var y = Math.floor(Math.random() * anypixel.config.height);

			initialStateButtons.push({x: x, y: y});

			document.dispatchEvent(new CustomEvent('buttonStates', {
				'detail': [{
					'p': {x: x, y: y},
					's': 1
				}]
			}));
		}, ms);
	}

	// Wait a few seconds to get to the initial state before triggering a state change
	setTimeout(function() {
		atInitialState = true;
	}, 12000);
});

/**
 * Event listener for imageLoadComplete. Sets logo textures and starts the update loop.
 */
function onImageLoadComplete() {
	logoTex = glUtils.createTextureFromImage(gl, logoImage);
	lastTime = new Date().getTime();
	window.requestAnimationFrame(update);
}
	
/**
 * Updates the state of the reaction and renders it to the screen
 */
function update(time) {

	// Apply changes to feed value
	if (!almostEqual(reactionUniforms.feed.value, fkModes[currentMode].f) && feedChange !== 0) {
		reactionUniforms.feed.value += feedChange * changeLimit;
	} else {
		feedChange = 0;
	}

	// Apply changes to kill value
	if (!almostEqual(reactionUniforms.kill.value, fkModes[currentMode].k) && killChange !== 0) {
		reactionUniforms.kill.value += killChange * changeLimit;
	} else {
		killChange = 0;
	}

	// Apply changes to logo amount value
	if (!almostEqual(reactionUniforms.logoAmount.value, fkModes[currentMode].g) && logoChange !== 0) {
		reactionUniforms.logoAmount.value += logoChange * (changeLimit * 10000);
	} else {
		logoChange = 0;
	}

	// If the idle timer is up, trigger the feed and kill values to shift, and restart the timer
	if (!idleTimer.hasStarted() && 
			feedChange == 0 && 
			killChange == 0 && 
			logoChange == 0 && 
			atInitialState) {
		idleTimer.start(function() {
			var df = fkModes[currentMode].f,
					dk = fkModes[currentMode].k,
					dg = fkModes[currentMode].g;

			currentMode = (currentMode + 1) % fkModes.length;

			df -= fkModes[currentMode].f;
			dk -= fkModes[currentMode].k;
			dg -= fkModes[currentMode].g;

			feedChange = Math.sign(df) * -1;
			killChange = Math.sign(dk) * -1;
			logoChange = Math.sign(dg) * -1;

		}, fkModes[currentMode].idle);
	}

	// Release the initial seeding events shortly after they are triggered
	if (initialStateButtons.length) {
		setTimeout((function(initialEvent) {
			return function() {
				document.dispatchEvent(new CustomEvent('buttonStates', {
					'detail': [{
						'p': {x: initialEvent.x, y: initialEvent.y},
						's': 0
					}]
				}));
			};
		}(initialStateButtons.shift())), 50);
	}

	// Calculate delta time
	var dt = (time - lastTime) / 2;
	if (dt > 0.8 || dt <= 0) {
		dt = 0.8;
	}
	lastTime = dt;
	reactionUniforms.delta.value = dt;

	eventContext.fillStyle = '#000';
	eventContext.fillRect(0, 0, sizeX, sizeY);

	// Draw button events as pixels on the event canvas, which is used to seed the reaction
	if (Object.keys(anypixel.events.pushedButtons).length) {
		eventContext.save();
		eventContext.scale(sizeX / anypixel.config.width, sizeY / anypixel.config.height);
		eventContext.fillStyle = '#FFF';

		for (var key in anypixel.events.pushedButtons) {
			var button = anypixel.events.pushedButtons[key];
			eventContext.fillRect(button.x, button.y, 1, 1);
		}

		eventContext.restore();
	}

	// Update image textures
	glUtils.updateImageTexture(gl, eventTex, eventCanvas);
	glUtils.updateImageTexture(gl, circleTex, circles.getCanvas());

	// Evaluate the reaction shaders multiple times. The number of iterations determines the speed
	// of the reaction.
	for (var i = 0; i < 4; i++) {
		gl.viewport(0, 0, sizeX, sizeY);

		// Set reaction shader unitofmrs
		gl.useProgram(progReaction);
		glUtils.setUniforms(gl, progReaction, reactionUniforms);

		// Bind logo brush texture
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, logoTex);

		// Bind button texture
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, eventTex);

		// Bind circles texture;
		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, circleTex);

		// Bind source double-buffered texture
		if (useSecondBuffer) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, tex2);
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo1);
		} else {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, tex1);
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo2);
		}

		// Draw full-screen quad to the bound framebuffer
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		gl.flush();

		// Swap buffers
		useSecondBuffer = !useSecondBuffer;
	}

	// Set viewport and screen shader uniforms
	gl.viewport(0, 0, anypixel.config.width, anypixel.config.height);
	gl.useProgram(progScreen);
	glUtils.setUniforms(gl, progScreen, screenUniforms);

	// Bind the currently active buffer to the TEXTURE0 slot
	if (useSecondBuffer) {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE0, tex2);
	} else {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, tex1);
	}

	// Draw full-screen quad to the screen
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	gl.flush();

	window.requestAnimationFrame(update);
}

function tolerance(precision) {
 	if (precision == null) precision = 7;
	return 0.5 * Math.pow(10, -precision);
}

function almostEqual(a, b, precision) {
	return Math.abs(a - b) < tolerance(precision);
}; 