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
var Scene = require('./scene');
var Speed = require('./speed');
var StarManager = require('./star-manager');

var speedFactor = 8;
var explodeVelocityForce = 5;
var explodeDampingForce = 0.995;
var resetDistance = 1.5;

/**
 * Proivdes a container for a letter object. The letters are updated much like stars are, but they
 * require some extra positioning due to their use of PlaneGeometry rather than cylinders.
 */
var Letter = module.exports = function(manager, options) {
	var letterGeo = new THREE.PlaneGeometry(options.size.x, options.size.y);
	var letterMat = options.material;

	this.manager = manager;

	this.letterMesh = new THREE.Mesh(letterGeo, letterMat);

	this.exploderMesh = options.exploderMesh;
	this.exploderMesh.rotation.x = Math.PI / 2;
	this.exploderMesh.visible = false;

	this.exploderVerts = this.exploderMesh.geometry.getAttribute('position').array;

	this.group = new THREE.Group();
	this.group.add(this.letterMesh);
	this.group.add(this.exploderMesh);

	// Move origin point to top left corner
	this.group.position.x += options.size.x / 2;
	this.group.position.y -= options.size.y / 2;

	// Apply offsets
	this.group.position.x += options.offset.x;
	this.group.position.y -= options.offset.y;

	// Actual width is the sum of horizontal size and offset
	this.group.userData = {
		size : new THREE.Vector2(options.size.x + options.offset.x, options.size.y)
	};

	this.isWaitingToReset = false;
}

/**
 * Updates the position of the letter, and resets it after passing the z axis kill plane
 */
Letter.prototype.update = function() {
	if (this.group.position.z <= Scene.span.z / 2 && !this.isWaitingToReset) {
		this.group.position.z += Speed.value * speedFactor;
		this.isWaitingToReset = false;
	}

	if (this.group.position.z > Scene.span.z / 2 && Speed.value <= Speed.minValue) {
		this.group.position.z = this.group.userData.startingZ;
		this.isWaitingToReset = true;
	}
}

/**
 * Using points from the exploder mesh, explode the letter into many star fragments. This mesh is 
 * essentially a random net of vertices, hand-tuned for an even distribution of particles inside the 
 * volume of the letter. The letter is not actually destoyed; rather, it is reset back to its 
 * original starting position.
 */
Letter.prototype.explode = function() {
	if (this.isWaitingToReset)
		return;

	// Save the current position, then reset it
	var currentPos = this.group.position.clone();
	this.group.position.z = this.group.userData.startingZ;
	this.isWaitingToReset = true;

	// Get list of vertices from the exploder mesh. Each vertex is used as a star spawn position
	for (var i = 0, l = this.exploderVerts.length; i < l; i += 3) {
		var vertex = new THREE.Vector3(this.exploderVerts[i + 0], this.exploderVerts[i + 2], 0);

		// The star transform is world-relative, but the vertex position is local
		var position = vertex.clone();

		// Offset by current letter group position
		position.add(currentPos);

		// Scale by the global scale factor
		position.multiply(new THREE.Vector3(Scene.scale, Scene.scale, 1));

		// Add the offset from the manager group position
		position.add(this.manager.getOffset());

		// Triple the number of generated particles and randomly perturb their positions +/- 2 units
		for (var j = 0; j < 3; j++) {
			var uniScale = 0.5 + Math.random() * 0.5;

			var positionJitter = new THREE.Vector3(
				randomRange(-2, 2), randomRange(-2, 2), randomRange(-2, 2));

			// Since each vertex position is centered at (0, 0, 0), velocity is obtained by normalizing
			var velocity = vertex.clone().add(positionJitter).normalize();
			velocity.z = explodeVelocityForce;

			StarManager.add({
				position: position.clone().add(positionJitter),
				velocity: velocity,
				scale: new THREE.Vector3(uniScale, 0.01, uniScale),
				decay: new THREE.Vector3(explodeDampingForce, explodeDampingForce, 1),
				killZ: Scene.span.z / 2,
				loop: false
			});
		}
	}

	function randomRange(min, max) {
		return Math.random() * (max - min) + min;
	}
}