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
var Star = require('./star');
var StarManager = require('./star-manager');
var LetterManager = require('./letter-manager');
var Scene = require('./scene');
var Speed = require('./speed');

var material2, mesh, backPlane;
var starHitDistanceThreshold = 50;
var letterHitDistanceThreshold = 70;

var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();

/**
 * Event listener for DOMContentLoaded. Sets up the rear click event plane
 */
document.addEventListener('DOMContentLoaded', function() {
	planeGeo = new THREE.PlaneGeometry(2000, 1000);
	material2 = new THREE.MeshBasicMaterial({color: 0xFF00FF, side: THREE.DoubleSide});

	backPlane = new THREE.Mesh(planeGeo, material2);
	backPlane.position.z = Scene.span.z / 2 - 10;
	backPlane.visible = false;
	Scene.getScene().add(backPlane);

	window.requestAnimationFrame(update);
});

/**
 * Event listener for buttonDown. Figures out what to explode based on what type of object has been
 * hit. If a letter has been hit, explode it. Otherwise, if a star has been hit, explode it. 
 * Finally, if nothing has been hit but the backplane, generate a few random star fragments there.
 */
document.addEventListener('onButtonDown', function(event) {
	mouse.x = (event.detail.x / anypixel.config.width) * 2 - 1;
	mouse.y = -(event.detail.y / anypixel.config.height) * 2 + 1;

	raycaster.setFromCamera(mouse, Scene.getCamera());
	var starIntersects = raycaster.intersectObjects(StarManager.meshes);
	var letterIntersects = raycaster.intersectObjects(LetterManager.meshes);
	var backplaneIntersects = [];

	var hitPoint = new THREE.Vector3();
	
	var castAgainstStars = false;
	var castAgainstPlane = false;

	// Hit test priority is: close letters > close stars > backplane
	if (letterIntersects.length > 0) {
		hitPoint = new THREE.Vector3().copy(letterIntersects[0].object.position);
		// If the hit is close enough, explode the hit letter
		if (letterIntersects[0].distance < letterHitDistanceThreshold) {
			LetterManager.explodeOne(letterIntersects[0].object);
			return;
		} else {
			castAgainstStars = true;
		}
	} else {
		castAgainstStars = true;
	}
		
	// Test against stars if the letter test fails
	if (castAgainstStars && starIntersects.length > 0) {
		hitPoint = new THREE.Vector3().copy(starIntersects[0].object.position);
		// If the hit is close enough, explode the hit star
		if (starIntersects[0].distance < starHitDistanceThreshold && starIntersects[0].distance > 2) {
			StarManager.explodeOne(starIntersects[0].object);
			return;
		} else {
			castAgainstPlane = true;
		}
	} else {
		castAgainstPlane = true;
	}

	// Test against the backplane if both letters and stars fail
	if (castAgainstPlane) {
		backPlane.raycast(raycaster, backplaneIntersects);
		hitPoint = backplaneIntersects[0].point;

		var nFragments = Math.floor(8 + Math.random() * 6);

		// Make star fragments
		while (nFragments--) {
			var uniScale = 0.5 + Math.random() * 0.5;
			StarManager.add({
				position: hitPoint.clone(),
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
});

/**
 * Triggers the updating of the star and letter maanagers
 */
function update(t) {
	StarManager.update();
	LetterManager.update();
	window.requestAnimationFrame(update);
}
