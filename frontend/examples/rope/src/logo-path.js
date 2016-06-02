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
var parse = require('svg-path-parser');
var bSpline = require('b-spline');
var THREE = require('three');
var Scene = require('./scene');
var ConstantSpline = require('../third_party/spite/constant-spline');
var cvToSplineParameter = require('../third_party/duznanski/cv-to-spline-parameter');
var spiralPathGenerator = require('./spiral-path-generator');
var blobDetect = require('./blob-detect');
var debugGrapher = require('./debug-grapher');

require('./math');

var logoPath = module.exports = {};

var svgPath = "M1406,209.3c-93.9,0-163.3-78.9-238.5,1.8c-46.1,49.5-107.7,43.5-129.8,20.9c-22.1-22.6-25.1-61.4-6.7-87.1c5.3-7.4,12.7-14,21.7-15.2c9-1.2,19.3,5.1,19.6,14.2c0.8,25.5-57.1,102.2-109.5,109.9c-46,6.8-42.7-34.2-33.8-70.9c22.2-90.7,70-146.9,87.3-132.6c28.1,23.3-110.9,242.2-199.5,241c-58.6-0.8-78.4,74.9-57.8,87c31.1,18.3,65.7-62.1,73.6-85.4c1.5-4.3,2.4-8.8,2.7-13.3c1.7-20.3,8.3-84.4,26.9-101.4c22.2-20.3,29.3,2.3,25,14.1c-4.3,11.7-23.8,54.3-68.4,66c-56.6,14.8-51.1-63.9-9.2-109.5c11.9-12.9,40.5-34.2,51.4-14.8c11.6,20.6-47.4,44.2-72.3,51.7c-24.8,7.5-37.7-19.1-37.7-19.1c-14.9-17.1-41.5-36.4-76.7,11.7c-19.5,26.7-20.8,63.3,0.1,77.5c38.6,26.4,105.7-109.1,63-130.6c-49.8-25.1-76.5,42.3-105.4,68.8c-12.9,11.9-27.3-1.4-36.2-23.1c-7.9-19.2-27.1-44.1-61.1,8.9c-45.2,70.6,1,82.9,18.7,77.3c26.3-8.3,80.9-71.4,49.7-119.9c-24.3-37.7-71.7-12.7-98.3,39.1c-29.6,57.6-59.6,94.5-112.2,98.5c-78.8,6-86.5,77.6-66.3,94.7c19.8,16.8,52.5,13.1,83.8-46.6c24.3-46.3,6.5-89.4,7.1-112.2c1.5-59.3,92.5-110.5,35.1-17c-7.4,12-14.3,21.5-20.9,29c-36.6,41.5-105,5.1-90.3-48.3c17.7-64.5,101.1-108.5,131-120.7c38.6-15.6,86.9,5.1,36.9,41.5c-39.9,29.1-68,9.3-110.1-2.2c-23.1-6.3-46.6-12.7-70.6-11.5c-64.3,3.1-112.4,57.4-168.5,89c-49,27.6-107.4,38.2-163,29.6";
var scale = 0.035;
var lerpFactor = 1;
var lerpSpeed = 0.04;
var splineStepDistance = 0.492;
var noiseFrequency = 0.004;
var noiseFalloffAmount = 3;
var noiseBaseline = 0.2;
var noisePhase = 0;
var zOffset = 0;

var logoWiggleAmp = 0.4;
var logoWiggleFreq = 15;
var logoNoiseAmp = 0.07;

var fullParsedPath = parse(svgPath);
var initialOffset = fullParsedPath.shift();
var parsedCurves = fullParsedPath.slice(0);
var splines = [];
var nSplinePoints = 0;

// Random values to seed the wave noise
var r1 = Math.random() * 10,
		r2 = Math.random() * 10;

/**
 * Generates an interpolated path from the spiral generated path and the logo path. 
 * The interpolation value is determined by whether or not any buttons are held down.
 */
logoPath.getGeometry = function() {
	var offset = {x: initialOffset.x, y: initialOffset.y};

	// If any buttons are down, ramp up the lerp factor to transition from the logo to the 
	// programatic loopy curve
	if (Object.keys(anypixel.events.pushedButtons).length > 0) {
		lerpFactor = Math.max(0, lerpFactor - lerpSpeed);
	} else {
		lerpFactor = Math.min(1, lerpFactor + lerpSpeed);
	}

	// Generate an initial spline from the parsed logo curves
	parsedCurves.forEach(function(curve, i) {
		var p0a = new THREE.Vector3(offset.x, offset.y, zOffset);
		var p1a = new THREE.Vector3(offset.x + curve.x1, offset.y + curve.y1, zOffset);
		var p2a = new THREE.Vector3(offset.x + curve.x2, offset.y + curve.y2, zOffset);
		var p3a = new THREE.Vector3(offset.x + curve.x,  offset.y + curve.y,  zOffset);

		// Reuse a previous spline instance if we can
		var spline = splines.length == parsedCurves.length ? splines[i] : new THREE.ConstantSpline();

		spline.p0 = p0a.multiplyScalar(scale);
		spline.p1 = p1a.multiplyScalar(scale);
		spline.p2 = p2a.multiplyScalar(scale);
		spline.p3 = p3a.multiplyScalar(scale);
		spline.calculate();

		// The first iteration is used to figure out the number of points used by the logo spline.
		// Since the logo is what the spline is initialized with, the number of points it uses are saved
		// and reused next time to ensure a constant number of points in the spline from one frame to
		// the next.
		if (!nSplinePoints) {
			spline.reticulate({distancePerStep: splineStepDistance});
		} else {
			spline.reticulate({steps: Math.floor(nSplinePoints / parsedCurves.length)});
		}

		if (splines.length < parsedCurves.length) {
			splines.push(spline);
		}

		offset.x += curve.x;
		offset.y += curve.y;
	});

	var geometry = new THREE.Geometry();

	// Set the spline points to geometry vertices
	splines.forEach(function(spline) {
		for (var j = 0; j < spline.lPoints.length - 1; j++) {
			var vertex = spline.lPoints[j].clone();
			vertex.y *= -1;
			geometry.vertices.push(vertex);
		}
	});

	// The splines and points come in right-to-left order due to the logo path's winding direction,
	// but they need to be left-to-right for future operations  
	geometry.vertices.reverse();

	// Get points from the spiral interaction path. They need to be converted to an array format in 
	// order to be used by the b-spline library
	var pathPoints = spiralPathGenerator.generatePath().map(function(p) { return [p.x, p.y]; });

	// The order is between 2 and 4, depending on the number of points
	var order = Math.max(2, Math.min(pathPoints.length - 1, 4));
	var knots = [];
	var orderNum = pathPoints.length + order;
	var len = orderNum - (order * 2);
	var i = 0;

	// Create knots array
	while (knots.length < order - 1) knots.push(i);
	for (i = 0; i <= len; i++) knots.push(i);
	while (knots.length < orderNum) knots.push(i);
	
	// Compute the length of linear segments in the curves's b-spline. These are used to parameterize 
	// the curve by arclength. Also, get the minimum and maximum distance values for normalization.
	var segments = [0], p0;
	var distances = [0];
	var arcLength = 0;
	var minDistance = Infinity, maxDistance = 0;
	for (var i = 0; i <= geometry.vertices.length; i++) {
		var t = i / geometry.vertices.length;
		var p1 = bSpline(t, order, pathPoints, knots);
		if (p0) {
			var dx = p0[0] - p1[0];
			var dy = p0[1] - p1[1];
			var d = Math.sqrt(dx * dx + dy * dy);
			arcLength += d;
			segments.push(arcLength);
			distances.push(d);

			if (d > maxDistance) { maxDistance = d; }
			if (d < minDistance) { minDistance = d; }
		} else {
			p0 = [0, 0];
		}
		p0[0] = p1[0];
		p0[1] = p1[1];
	}

	// First item in the distance list is 0, but this is misleading. The line starts at index 0
	// but visually it looks like it's part of a much larger line, so reuse the second distance
	// to fake a line that goes off screen forever
	distances[0] = distances[1];

	// Normalize distances to 0..1. This data is used to scale the wave noise applied to the spline.
	var normalizedDistances = distances.map(function(d) {
		return (d - minDistance) / (maxDistance - minDistance);
	});

	var normDistanceByT = [];
	var noiseData = [];
	var yData = [];
	var tData = [];

	// Lerp between logo path verticies and spiral path vertices. The spiral path vertices are 
	// interpolated using a b-spline, which is sampled evenly according to the number of vertices in 
	// the original geometry object. This prevents rendering glitches caused by THREE.BufferGeometry 
	// being assigned a different number of points than what it was initialized with.
	geometry.vertices = geometry.vertices.map(function(v1, i, a) {
		var u = i / a.length;
		var t = cvToSplineParameter(u, segments);
	
		// Re-sample the spline position using the arc-length parameterized offset value. This ensures
		// that the spline is sampled at a constant velocity. 
		var p = bSpline(t, order, pathPoints, knots);
		var v2 = new THREE.Vector3(p[0], -p[1], zOffset).multiplyScalar(scale * 10);

		// Add wave noise on the y axis. The noise is scaled by a bell curve centered at x = 0 to ensure
		// stability on the left and right edges of the spline.
		var u2 = u - 0.5;
		var noiseFalloff = Math.exp(noiseFalloffAmount * -u2 * u2);
		var noise = Math.curveNoise(u + noisePhase, r1, r2) * 1 / 2 / scale * noiseFalloff;
		var v2Noise = v2.clone();
		v2Noise.y += noise;

		tData.push(t);
		noiseData.push(noise);

		// Add some sine wiggle and noise to the logo
		v1.y += Math.sin(u * 5 + noisePhase * logoWiggleFreq) * logoWiggleAmp + noise * logoNoiseAmp;

		// The normalized distance corresponds to the distance between points on the unparameterized 
		// spline. These points are more concentrated in areas of high curvature, and therefore give 
		// smaller distances between points in these areas. This serves as a measure of visual 
		// complexity, and is used to interpolate between the noisy spline and the clean spline. Areas 
		// of high curvature are affected less, so they retain their original shape. Additionally, a 
		// baseline amount is added to ensure that there is at least some wave motion over the entire 
		// curve.
		var d = normalizedDistances[Math.floor(t * a.length)];
		var tScaled = t * a.length;
		var tFloor = Math.floor(tScaled);
		var d1 = normalizedDistances[tFloor];
		var d2 = normalizedDistances[tFloor + 1];
		var dLerp = Math.lerp(d1, d2, tScaled - tFloor);
		v2 = new THREE.Vector3().lerpVectors(v2, v2Noise, dLerp + noiseBaseline);

		var lerpedOutput = new THREE.Vector3().lerpVectors(v2, v1, lerpFactor); 

		yData.push(lerpedOutput.y);
		normDistanceByT.push(dLerp);

		return lerpedOutput;
	});

	// Use the current number of vertices to determine how many steps we use to segment the spline
	// on the next frame
	if (!nSplinePoints) {
		nSplinePoints = geometry.vertices.length;
	}

	// If enabled, plot some debug information
	if (debugGrapher.isEnabled()) {
		var height = debugGrapher.getHeight();

		var circles = Object.keys(blobDetect.boundingCircles).map(function(key) {
			return blobDetect.boundingCircles[key];
		});

		// Segment data
		debugGrapher.updateGraphField('segment length', segments.map(function(s, i, a) {
			return height - (s / a[a.length - 1] * height);
		}));

		// Distance data
		debugGrapher.updateGraphField('distances', distances.map(function(d) {
			return height - (d / maxDistance * height);
		}));

		// Normalized distances data
		debugGrapher.updateGraphField('normalized distances', normDistanceByT.map(function(d) {
			if (Object.keys(anypixel.events.pushedButtons).length) {
				return (height / 1.2) - (d / maxDistance * height * 3);
			} else {
				return 0;
			}
		}));

		// Noise data
		debugGrapher.updateGraphField('noise', noiseData.map(function(d) {
			return height - ((d + 20) * 5);
		}));

		// Y-axis data
		debugGrapher.updateGraphField('y-axis', yData.map(function(d) {
			return height + d * 8;
		}));

		// T data
		debugGrapher.updateGraphField('b-spline t', tData.map(function(d) {
			return height - d * height;
		}));

		debugGrapher.clear();
		debugGrapher.drawCircles(circles);
		debugGrapher.drawGroups(blobDetect.groupMap);
		debugGrapher.drawPath(pathPoints);
		debugGrapher.drawGraphs();
	}

	noisePhase -= noiseFrequency;
	return geometry;
}
