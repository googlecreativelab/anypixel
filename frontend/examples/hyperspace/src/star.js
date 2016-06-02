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

var geo = new THREE.CylinderGeometry(1, 1, 1, 24);
var mat = new THREE.MeshBasicMaterial({color: 0xFFFFFF});

/**
 * Provides a single star particle, made up of a while cylinder. By using a cylinder, a nice
 * "warp speed" star-stretching effect can be gotten by scaling the cylinder on the z-axis in 
 * proportion to the velocity. 
 */
var Star = module.exports = function(options, manager) {
	this.mesh = new THREE.Mesh(geo, mat);
	this.killMe = false;
	this.isSpawnedIn = false;
	this.manager = manager;

	this.origScale = options.scale !== undefined ? options.scale.clone() : new THREE.Vector3(1, 1, 1);

	// Position, rotate, and scale according to options, with defaults. CylinderGeometry is oriented
	// on the y plane, so it must be rotated 90 degrees on the x axis so that it is oriented on the
	// z plane.
	this.mesh.position.copy(options.position || new THREE.Vector3(0, 0, 0));
	this.mesh.rotation.x = Math.PI / 2;
	this.mesh.scale.copy(options.scale || new THREE.Vector3(1, 1, 1));

	this.origPosition = this.mesh.position.clone();

	// Keep Out: prevent stars from spawning in a given radius around the center
	this.keepOut = options.keepOut !== undefined ? options.keepOut : 0;

	// Velocity: the direction the star is moving in. Default is full speed on the z axis.
	this.velocity = options.velocity || new THREE.Vector3(0, 0, 1);
	this.origVelocity = this.velocity.clone();

	// Decay: velocity decay vector. The velocity is multiplied by this value each frame. Used by
	// stars spawned from explosions to decrease their outward velocities
	this.decay = options.decay || new THREE.Vector3(1, 1, 1);

	// Loop: sets the star to loop around to a new random position instead of getting killed when it
	// crosses the z kill plane
	this.loop = options.loop !== undefined ? options.loop : true;

	// Stretch: whether or not the star is affected by the hyperspeed star-stretching effect
	this.stretch = options.stretch !== undefined ? options.stretch : true;

	// Kill Z: the z axis location of the kill plane which resets the star's positiom
	this.killZ = options.killZ || null;

	// Boose Z: the z axis location of the plane which increases a star's speed towards the camera
	this.boostZ = options.boostZ || 0;

	// Boost Amount: amount of speed gained each frame after crossing the boost z plane
	this.boostAmount = options.boostAmount || 1.007;

	if (this.loop) {
		this.mesh.position.z += Scene.initialZOffset;
	}

	this.applyKeepOut(this.keepOut);

	Scene.getScene().add(this.mesh);
}

/**
 * Updates the position and velocity of the star, and respawns it if it falls out of bounds.
 */
Star.prototype.update = function() {
	if (this.boostZ && this.mesh.position.z > this.boostZ) {
		this.velocity.z *= this.boostAmount;
	}

	// When the app first loads, the stars are positioned far away so that the screen appears black.
	// For an intro animation, increase the speed until the first one loops back around.
	if (this.loop) {
		if (this.mesh.position.z < this.origPosition.z && !this.manager.firstLoop) {
			this.velocity.z = 60;
		} else {
			this.velocity.z = Math.max(this.velocity.z - 1, this.origVelocity.z);
		}
	}

	this.velocity.multiply(this.decay);

	this.mesh.position.x += this.velocity.x;
	this.mesh.position.y += this.velocity.y;
	this.mesh.position.z += this.velocity.z * Speed.value;

	if (this.stretch) {
		this.mesh.scale.y = this.origScale.y + Speed.hyperValue;
	}

	// If the star passes the z-axis kill plane, move it somewhere random, far behind the kill plane. 
	// If the star is not persistant, mark it to be killed instead.
	if (this.mesh.position.z > this.killZ) {
		this.isSpawnedIn = true;

		if (this.manager && !this.manager.firstLoop) {
			this.manager.firstLoop = true;
		}

		if (this.loop) {
			this.mesh.position.x = Math.random() * Scene.span.x - (Scene.span.x / 2),
			this.mesh.position.y = Math.random() * Scene.span.y - (Scene.span.y / 2),
			this.mesh.position.z = 0; 
			this.velocity.set(0, 0, this.origVelocity.z);
			this.applyKeepOut(this.keepOut);
		} else {
			this.killMe = true;
		}
	}
}

/**
 * If this star is given a keepout radius, push the star out of this zone if it's inside it. The
 * keepout zone is used to prevent stars from spawning where the logo letters are.
 */
Star.prototype.applyKeepOut = function(keepOut) {
	if (keepOut > 0) {
		var pos2D = new THREE.Vector2(this.mesh.position.x, this.mesh.position.y);
		if (pos2D.length() < keepOut) {
			pos2D.normalize().multiplyScalar(keepOut);
			this.mesh.position.x += pos2D.x;
			this.mesh.position.y += pos2D.y;
		}
	}
}

/**
 * Reset the position, velocity, and decay vectors to a given value
 */
Star.prototype.reset = function(options) {
	this.mesh.position.copy(options.position || new THREE.Vector3(0, 0, 0));
	this.velocity.copy(options.velocity || new THREE.Vector3(0, 0, 1));
	this.decay.copy(options.decay || new THREE.Vector3(1, 1, 1));
}