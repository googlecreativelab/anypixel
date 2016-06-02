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
var Scene = require('./scene');
var MeshLine = require('../third_party/spite/mesh-line');
var logoPath = require('./logo-path');
var debugGrapher = require('./debug-grapher');

// require('./debug-events');

var time = 0;
var phase = 0;
var transition = 0;
var delay = 0;
var line, mesh, material;

/**
 * Event listener for DOMContentLoaded. Loads the color ramp and kicks everything off
 */
document.addEventListener('DOMContentLoaded', function() {
	var loader = new THREE.TextureLoader();
	loader.load('img/color_ramp.png', function(texture) {
		onTextureLoadComplete(texture);
	});

	// debugGrapher.enable();
});

/**
 * Event listener for the color ramp's onLoadComplete. Creates the mesh line and the line material. 
 */
function onTextureLoadComplete(texture) {
	material = new THREE.MeshLineMaterial({
		useMap: true,
		map: texture,
		lineWidth: 0.7,
		resolution: new THREE.Vector2(anypixel.config.width, anypixel.config.height)
	});

	line = new THREE.MeshLine();
	line.setGeometry(logoPath.getGeometry());
	mesh = new THREE.Mesh(line.geometry, material);
	Scene.getScene().add(mesh);

	window.requestAnimationFrame(update);
}

/**
 * Updates the state of the line geometry and advances some counters used for noise generation
 * and gradient animation inside the MeshLine shaders.
 */
function update(t) {
	line.setGeometry(logoPath.getGeometry());

	time += 0.007;
	phase += 0.004;
	delay += 0.1;

	// Use a bell curve to ease in and out the transition speed
	var tx = transition - 0.52;
	var tSpeed = Math.exp(3 * -tx * tx) * 0.007;
	transition = delay > 1 ? Math.min(transition + tSpeed, 1) : 0;

	material.uniforms.offsetTime.value = time;
	material.uniforms.offsetTime.needsUpdate = true;
	material.uniforms.phase.value = phase;
	material.uniforms.phase.needsUpdate = true;
	material.uniforms.transition.value = transition;
	material.uniforms.transition.needsUpdate = true;
	window.requestAnimationFrame(update);
}
