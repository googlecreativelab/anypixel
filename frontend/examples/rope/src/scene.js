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
var THREE = require('three');

var threeScene, threeRenderer, threeCamera;
var threeCanvas, threeContext, ctx;

/**
 * Provides a manager for the threejs scene, camera, and rendering functionality.
 */
var Scene = module.exports = {};

/**
 * Event listener for DOMContentLoaded. Sets up the scene, camera, and renderer.
 */
document.addEventListener('DOMContentLoaded', function() {
	threeScene = new THREE.Scene();

	ctx = anypixel.canvas.getContext2D();

	threeCanvas = document.createElement('canvas');
	threeCanvas.width = anypixel.config.width;
	threeCanvas.height = anypixel.config.height;
	threeContext = threeCanvas.getContext('webgl', {antialias: false});

	threeCamera = new THREE.PerspectiveCamera(60, anypixel.config.width / anypixel.config.height, 0.0001, 1000);
	threeCamera.position.set(24.5, -7.5, 12.5);

	threeRenderer = new THREE.WebGLRenderer({context: threeContext});
	threeRenderer.setSize(anypixel.config.width, anypixel.config.height);
	threeRenderer.setClearColor(0x00000000);

	threeRenderer.context.imageSmoothingEnabled = false;

	function render(t) {
		threeRenderer.render(threeScene, threeCamera);
		ctx.drawImage(threeCanvas, 0, 0);
		window.requestAnimationFrame(render);
	}

	window.requestAnimationFrame(render);
});

/**
 * Returns the scene object
 */
Scene.getScene = function() {
	return threeScene;
}

/**
 * Returns the camera object
 */
Scene.getCamera = function() {
	return threeCamera;
}

/**
 * Returns the renderer object
 */
Scene.getRenderer = function() {
	return threeRenderer;
}