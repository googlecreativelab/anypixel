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
var OBJLoader = require('../third_party/threejs/obj-loader')(THREE);
var Letter = require('./letter');
var Scene = require('./scene');
var Speed = require('./speed');

/**
 * Manages the loading and updating of the logo letters. Each letter consists of a plane with a PNG
 * texture, and a mesh used for determining the position of any explosion-generated star fragments.
 */
var LetterManager = module.exports = {};

LetterManager.meshes = [];

var letterProperties = [
	{ tex: 'img/logo_00.png', mesh: 'obj/explode-upper-G.obj',   size: new THREE.Vector2(248, 254), offset: new THREE.Vector2(0.00,  1.0) },
	{ tex: 'img/logo_01.png', mesh: 'obj/explode-lower-O-1.obj', size: new THREE.Vector2(164, 163), offset: new THREE.Vector2(11.2, 90.6) },
	{ tex: 'img/logo_02.png', mesh: 'obj/explode-lower-O-2.obj', size: new THREE.Vector2(164, 163), offset: new THREE.Vector2(14.5, 90.6) },
	{ tex: 'img/logo_03.png', mesh: 'obj/explode-lower-G.obj',   size: new THREE.Vector2(157, 237), offset: new THREE.Vector2(14.7, 90.7) },
	{ tex: 'img/logo_04.png', mesh: 'obj/explode-lower-L.obj',   size: new THREE.Vector2(36,  241), offset: new THREE.Vector2(23.8,  9.4) },
	{ tex: 'img/logo_05.png', mesh: 'obj/explode-lower-E.obj',   size: new THREE.Vector2(150, 164), offset: new THREE.Vector2(16.2, 90.5) }
];

var letterMaterials = {};
var letterMeshes = {};
var letterGroup = new THREE.Group();
var letterObjects = {};
var loadingManager = new THREE.LoadingManager();

// Amount of space on each axis between each letter
var separation = new THREE.Vector3(50, 0, 15);

/**
 * Event listener for DOMContentLoaded. Configures and loads the pngs and objs into a load queue.
 */
document.addEventListener('DOMContentLoaded', function() {
	var texLoader = new THREE.TextureLoader(loadingManager);
	var objLoader = new THREE.OBJLoader(loadingManager);

	letterProperties.forEach(function(letterProp, i) {
		texLoader.load(letterProp.tex, function(tex) {
			tex.magFilter = THREE.NearestFilter;
			tex.minFilter = THREE.NearestFilter;
			var name = tex.image.getAttribute('src');
			letterMaterials[name] = new THREE.MeshBasicMaterial({map: tex, transparent: true});
		});

		objLoader.load(letterProp.mesh, function(object) {
			var mesh = object.children[0];
			letterMeshes[mesh.name.replace('_', '/').replace('_', '.')] = mesh;
		});
	});
});

/**
 * Updates the position of each letter, and manages the reset state of each letter. The letters
 * are reset as a group, once each one is ready. During hyperspace, this functionality is used
 * to ensure that letters do not reset until hyperspace is over. Otherwise, letters would be flying
 * past the screen far too often, which looks distracting.
 */
LetterManager.update = function() {
	// Flag is set when all letters are reset to their starting positions
	var allReset = true;

	for (var key in letterObjects) {
		var letter = letterObjects[key];
		letter.update();
		
		// If any letter is not waiting to be reset, clear the flag
		if (!letter.isWaitingToReset) {
			allReset = false;
		}
	}

	// Clear each letter's reset flag if every letter is ready to be reset
	if (allReset) {
		for (var key in letterObjects) {	
			letterObjects[key].isWaitingToReset = false;
		}
	}
}

/**
 * Explode this letter, if it's explosion mesh exists
 */
LetterManager.explodeOne = function(object) {
	if (letterObjects.hasOwnProperty(object.uuid)) {
		letterObjects[object.uuid].explode();
	}
}

/**
 * Event listener for onLoad, called when the loading manager is done. Positions each letter and 
 * adds it to the global letters group.
 */
loadingManager.onLoad = function() {
	var widthSum = 0;
	var zSum = separation.z * letterProperties.length;

	// Create letters
	letterProperties.forEach(function(letterProp, i) {
		var letter = new Letter(LetterManager, {
			size: letterProp.size,
			offset: letterProp.offset,
			material: letterMaterials[letterProp.tex],
			exploderMesh: letterMeshes[letterProp.mesh]
		});

		letterObjects[letter.letterMesh.uuid] = letter;
		letterGroup.add(letter.group);

		LetterManager.meshes.push(letter.letterMesh);
	});

	var maxLetterHeight = letterGroup.children[0].userData.size.y;

	// Position letters
	letterGroup.children.forEach(function(letter, i) {
		// Offset x by the sum of the widths of the previous letters
		letter.position.x += widthSum;

		// Add a bit of extra x spacing to improve readability as the letters fly past
		letter.position.x += i > 0 ? separation.x : 0;

		letter.position.z = ((zSum * 2) - Scene.span.z) / 2;
		letter.userData.startingZ = letter.position.z;

		widthSum += letter.userData.size.x;
		widthSum += i > 0 ? separation.x : 0;
		zSum -= separation.z;
	});

	// Center the entire letter group
	letterGroup.scale.x = letterGroup.scale.y = Scene.scale;
	letterGroup.position.x -= (widthSum - separation.x) / 2 * Scene.scale;
	letterGroup.position.x -= 2;
	letterGroup.position.y += maxLetterHeight / 2 * Scene.scale;
	letterGroup.position.y += 1.5;

	Scene.getScene().add(letterGroup);
};

/**
 * Returns the position of the letter group
 */
LetterManager.getOffset = function() {
	return letterGroup.position;
}
