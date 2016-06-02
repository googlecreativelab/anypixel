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
var Composer = require('three-effectcomposer')(THREE);
var ThresholdShader = require('../third_party/threejs/threshold-shader');

var threeScene, threeRenderer, threeCamera, threeComposer;

/**
 * Provides a manager for the threejs scene, camera, and rendering functionality.
 */
var Scene = module.exports = {};

/**
 * Event listener for DOMContentLoaded. Sets up the scene, camera, renderer, and effects compositor.
 * The effects compositor is used to apply a threshold effect on the rendered output.
 */
document.addEventListener('DOMContentLoaded', function() {
	threeScene = new THREE.Scene();

	threeCamera = new THREE.PerspectiveCamera(120, anypixel.config.width / anypixel.config.height, 0.0001, 1000);
	threeCamera.position.z = Scene.span.z / 2;

	threeRenderer = new THREE.WebGLRenderer({context: anypixel.canvas.getContext3D()});
	threeRenderer.setSize(anypixel.config.width, anypixel.config.height);
	threeRenderer.setClearColor(0x000000);

	threeComposer = new Composer(threeRenderer);

	var renderPass = new Composer.RenderPass(threeScene, threeCamera);
	var threshPass = new Composer.ShaderPass(THREE.ThresholdShader);
	threshPass.renderToScreen = true;

	threeComposer.addPass(renderPass);
	threeComposer.addPass(threshPass);

	function render(t) {
		threeComposer.render(0.1);
		window.requestAnimationFrame(render);
	}

	window.requestAnimationFrame(render);
});

/**
 * Defines the valid spawn space for star particles. The space is defined as ±x, ±y, +z.
 */
Scene.span = new THREE.Vector3(anypixel.config.width, anypixel.config.height * 1.5, 200);

/**
 * Each imported letter mesh is scaled by this factor
 */
Scene.scale = 0.075;

Scene.initialZOffset = -300;

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