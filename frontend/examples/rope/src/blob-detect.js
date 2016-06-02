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

var smallestCircle = require('../third_party/csharphelper/min-bounding-circle');
var randomGen = require('random-seed');

var BlobDetect = module.exports = {};

var mergeRadius = 3;
var currentBlobGroup = 0;
var blobMap = BlobDetect.blobMap = {};
var groupMap = BlobDetect.groupMap = {};
var boundingCircles = BlobDetect.boundingCircles = {};
var deletedCircles = BlobDetect.deletedCircles = {};

// Offset for the random seed. Makes sure the first circle has a nice big radius.
var randomOffset = 3;

/**
 * Event listener for buttonDown. Figures out which blob group this event belongs and adds it.
 */
document.addEventListener('onButtonDown', function(event) {
	var pos = event.detail;
	var key = pos.x + ':' + pos.y;

	if (!blobMap.hasOwnProperty(key)) {
		for (var k in blobMap) {
			blobMap[k].checked = false;
		}

		blobMap[key] = { x: pos.x, y: pos.y, checked: false };
		
		// See if we overlap any other group's bounding circle
		var circleOverlaps = [];
		for (var circleKey in boundingCircles) {
			var c = {
				x: boundingCircles[circleKey].x,
				y: boundingCircles[circleKey].y,
				r: boundingCircles[circleKey].fr + mergeRadius
			};

			if (Math.isInCircle(c, pos)) {
				circleOverlaps.push(parseInt(circleKey));
			}
		}

		// If there are overlaps, find the biggest group out of all of them
		if (circleOverlaps.length) {

			var largestBlobGroup = currentBlobGroup, largestGroupSize = 1;
			circleOverlaps.forEach(function(groupId) {
				if (groupMap[groupId].length > largestGroupSize) {
					largestBlobGroup = groupId;
					largestGroupSize = groupMap[groupId].length;
					currentBlobGroup = largestBlobGroup;
				}
			});

			// Set everything in the overlapped groups to the current / largest group
			setGroup(blobMap[key], currentBlobGroup);
			circleOverlaps.forEach(function(groupId) {
				if (groupId !== currentBlobGroup) {
					var group = groupMap[groupId];
					while (group.length) {
						var item = group[group.length - 1];
						setGroup(item, currentBlobGroup);
					}	
				}
			});
		} else {
			while (groupMap.hasOwnProperty(currentBlobGroup)) currentBlobGroup++;
			setGroup(blobMap[key], currentBlobGroup);
		}
	}

	// Compress groups and cleanup
	consolidateGroups();
});

/**
 * Event listener for buttonUp. Removes the corresponding entry from the group map, and triggers the
 * reconsolidation of the group list.
 */
document.addEventListener('onButtonUp', function(event) {
	var pos = event.detail;
	var key = pos.x + ':' + pos.y;

	var group = blobMap[key].group;

	// Find and remove from groupMap and blobMap
	var idx = groupMap[group].indexOf(blobMap[key]);
	groupMap[group].splice(idx, 1);
	blobMap[key] = null;
	delete blobMap[key];

	consolidateGroups();
});

/**
 * Adds a given item to a given group. If the group doesn't exist, it is created.
 */
function setGroup(item, group) {
	// If the item is already in a group, find it and remove it
	if (item.group !== undefined) {
		if (groupMap.hasOwnProperty(item.group)) {
			var index = groupMap[item.group].indexOf(item);
			groupMap[item.group].splice(index, 1);
		}
	}

	// Add item to the new group
	item.group = group;

	// If this group doesn't exist, create it
	if (!groupMap.hasOwnProperty(group)) {
		groupMap[group] = [];
	}

	var event = new CustomEvent('blobAdded', { 'detail': item });
	document.dispatchEvent(event);

	groupMap[group].push(item);
}

/**
 * Removes duplicate entries from each group, and removes empty groups from groupMap.
 */
function consolidateGroups() {
	for (var key in groupMap) {
		groupMap[key] = uniqueFast(groupMap[key]);
		if (!groupMap[key].length) {
			delete groupMap[key];
			boundingCircles[key].kill = true;
			boundingCircles[key].life = 1;
			boundingCircles[key].fLife = 1;
			boundingCircles[key].fr = 0.001;
			boundingCircles[key].pr = boundingCircles[key].r;
			boundingCircles[key].py = boundingCircles[key].y;
			deletedCircles[key] = boundingCircles[key];
			delete boundingCircles[key];
			var event = new CustomEvent('blobDeleted', { 'detail': key });
			document.dispatchEvent(event);
		} else {
			// Compute the smallest circle which contains the point group
			if (boundingCircles[key] || deletedCircles[key]) {
				var c = boundingCircles[key];

				// If the circle doesn't exist in the boundingCircles list, try and find it in the 
				// deletedCircles list
				if (!c) {
					c = deletedCircles[key];
					boundingCircles[key] = c;
					delete deletedCircles[key];
					c = boundingCircles[key];
				}

				var newCircle = smallestCircle(groupMap[key]);

				c.kill = false;
				c.life = 1;
				c.fLife = 1;
				c.x = newCircle.x;
				c.y = newCircle.y;
				c.fr = Math.max(newCircle.r + 4, 8);
				c.fr += (c.rand - 0.5) * 10;

			} else {
				boundingCircles[key] = smallestCircle(groupMap[key]);
				boundingCircles[key].kill = false;
				boundingCircles[key].life = 1;
				boundingCircles[key].fLife = 1;
				boundingCircles[key].rand = randomGen(key + randomOffset).random();
				boundingCircles[key].fr = Math.max(boundingCircles[key].r + 4, 8);
				boundingCircles[key].fr += (boundingCircles[key].rand - 0.5) * 10;
				boundingCircles[key].r = 0.01;
				boundingCircles[key].vr = 0;
				boundingCircles[key].vx = 0;
				boundingCircles[key].vy = 0;
				boundingCircles[key].vL = 0;
			}
		}
	}
}

/**
 * Returns only the unique button entries in a given array
 */
function uniqueFast(a) {
	var seen = {};
	var out = [];
	var len = a.length;
	var j = 0;
	for (var i = 0; i < len; i++) {
		var item = a[i];
		if (seen[item.x + ':' + item.y] !== 1) {
			seen[item.x + ':' + item.y] = 1;
			out[j++] = item;
		}
	}
	return out;
}