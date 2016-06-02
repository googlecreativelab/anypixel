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

var THREE = require('three');
var Star = require('./star');
var Scene = require('./scene');
var Speed = require('./speed');

/**
 * Provides a manager which keeps track of adding, removing, and updating each star particle.
 */
var StarManager = module.exports = {};

StarManager.firstLoop = false;

var stars = {};
var spanKeepout = 8;
var boostZThresh = 88;

/**
 * Event listener for DOMContentLoaded. Spawns the initial set of stars.
 */
document.addEventListener('DOMContentLoaded', function() {
	for (var z = 0; z < Scene.span.z; z += 0.1) {
		var uniScale = Math.random() * 0.25 + 0.75;
		var star = new Star({
			position: new THREE.Vector3(
				Math.random() * Scene.span.x - (Scene.span.x / 2),
				Math.random() * Scene.span.y - (Scene.span.y / 2),
				z
			),
			scale: new THREE.Vector3(uniScale, 0.05, uniScale),
			keepOut: spanKeepout,
			boostZ: boostZThresh,
			killZ: Scene.span.z / 2
		}, StarManager);

		if (z > Scene.span.z / 2 && z < Scene.span.z / 2 + 0.1) {
			star.debug = true;
		}

		// Stars are keyed by their mesh uuids
		stars[star.mesh.uuid] = star;
		StarManager.meshes.push(star.mesh);
	}
});

/**
 * Update the position of each star, and remove any that are marked for deletion
 */
StarManager.update = function() {
	for (var key in stars) {
		var star = stars[key];
		star.update();
		if (star.killMe) {
			Scene.getScene().remove(star.mesh);
			delete stars[key];
		}
	}
}

/**
 * Adds a new star with a given set of options. 
 * See comments in star.js for information on theseoptions.
 */
StarManager.add = function(options) {
	var star = new Star({
		position: options.position || new THREE.Vector3(0, 0, 0),
		scale: options.scale || new THREE.Vector3(1, 0.05, 1),
		velocity: options.velocity || new THREE.Vector3(0, 0, 1),
		decay: options.decay || new THREE.Vector3(1, 1, 1),
		keepOut: options.keepOut !== undefined ? options.keepOut : 0,
		boostZ: options.boostZThresh !== undefined ? options.boostZThresh : boostZThresh,
		killZ: Scene.span.z / 2,
		loop: options.loop !== undefined ? options.loop : true,
		debug: options.debug !== undefined ? options.debug : false
	});

	stars[star.mesh.uuid] = star;
	StarManager.meshes.push(star.mesh);
}

/**
 * Explodes a given star into multiple fragment stars
 */
StarManager.explodeOne = function(object) {
	if (stars.hasOwnProperty(object.uuid)) {

		var currentPosition = object.position.clone();

		// Reset hit star's position
		stars[object.uuid].reset({
			position: new THREE.Vector3(
				Math.random() * Scene.span.x - (Scene.span.x / 2),
				Math.random() * Scene.span.y - (Scene.span.y / 2),
				object.position.z - Scene.span.z
			),
			velocity: new THREE.Vector3(0, 0, 1)
		});

		var nFragments = Math.floor(8 * Math.random() * 6);

		// Make star fragments
		while (nFragments--) {
			var uniScale = 0.5 + Math.random() * 0.5;
			StarManager.add({
				position: currentPosition.clone(),
				scale: new THREE.Vector3(uniScale, 0.1, uniScale),
				velocity: new THREE.Vector3(randomRange(-1, 1), randomRange(-1, 1), 5),
				decay: new THREE.Vector3(0.965, 0.965, 1),
				killZ: Scene.span.z / 2,
				loop: false
			});
		}
	}

	function randomRange(min, max) {
		return Math.random() * (max - min) + min;
	}
}

/**
 * List of star meshes
 */
StarManager.meshes = [];