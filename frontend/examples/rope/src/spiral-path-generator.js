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
var blobDetect = require('./blob-detect');
require('./math');

var hh = anypixel.config.height / 2;
var path = [], circleArray = [];
var s = 4;
var n = 369;
var smoothSpeed = 0.4;

var startPoint = {x: 0, y: hh};
var endPoint = {x: anypixel.config.width, y: hh};

/**
 * Generate a path which reacts to button interactions. The path loops around circles defined by 
 * each interconnected group of currently-pressed buttons. These loops are smoothly eased in and
 * out of existance.
 */
module.exports.generatePath = function() {
	var circleObj = blobDetect.boundingCircles;
	var weights = [1];

	// Convert circle objects to arrays, saving their keys as properties of each circle
	circleArray = Object.keys(circleObj).map(function(key) { 
		var c = circleObj[key];
		c.key = key;
		return c;
	});

	deletedCircleArray = Object.keys(blobDetect.deletedCircles).map(function(key) {
		var c = blobDetect.deletedCircles[key];
		c.key = key;
		return c;
	});

	// We'll be working with both both active and deleted circles
	circleArray = circleArray.concat(deletedCircleArray);

	// Define the first point on the path at the center of the left edge
	path = [{x: 0, y: hh}];

	// Sort the circles left-to-right
	circleArray.sort(function(a, b) {
		return a.x - b.x;
	});

	// Each circle in the array will be the center of a loop in the path. The shape of the loop is 
	// governed by the y axis position of the circle, and the properties of what is to the left
	// and right of the circle. The goal is to create a smooth path which looks nice. Awkward
	// changes in curve direction must be avoided, so care is taken to ensure that each circle
	// follows the flow of the path from the previous one.
	circleArray.forEach(function(c, i, a) {

		c.start = c.end = null;
		c.dir = c.y > hh ? 'cw' : 'ccw';

		var neighborL, neighborR, l = circleArray.length;
		var weight = 1;

		// Ease in any changes to the radius
		c.r = smoothControl(c.r, c.fr, c, 'vr', smoothSpeed, 500, 1 / 60);

		// Determine the left and right neighbors of the current circle. These can either be other 
		// active (not dead) circles, or the starting / ending points.
		if (circleArray.length < 1) {
			neighborR = startPoint;
			neighborL = endPoint;
		} else {
			var iR = i;
			var iL = i;

			// Move through the array and find the next active circle to the right and left. Failing
			// that, use the path's end point or start point, respectively.
			while (neighborR === undefined) {
				neighborR = iR < l - 1 ? circleArray[++iR] : endPoint;
				neighborR = neighborR.kill ? undefined : neighborR;
			} 

			while (neighborL === undefined) {
				neighborL = iL > 0 ? circleArray[--iL] : startPoint;	
				neighborL = neighborL.kill ? undefined : neighborL;
			}
		}

		// Calculate the tangent lines (http://mathworld.wolfram.com/Circle-CircleTangents.html)
		// between the current circle and its neighbors. These lines are used to determine a 
		// straight-line path between the previous loop and the current one. Two external tangent 
		// lines will be found a circle that does not contain its neighbor. The upper tangent line is 
		// used for loops going clockwise (⤵), and the bottom line is used for loops going 
		// counter-clockwise (⤴).
		var ccLTangents = Math.circleCircleTangents(c, neighborL);
		var ccRTangents = Math.circleCircleTangents(c, neighborR);
		var spTangents = [], epTangents = [];

		// If the left or right neighbors are the path's starting or ending points, find the tangent
		// lines between the current circle and the start or end point, respectively. These will 
		// be used instead of the circle-circle tangents.
		if (neighborL === startPoint) { spTangents = Math.pointTangentIntersection(c, startPoint); }
		if (neighborR === endPoint) { epTangents = Math.pointTangentIntersection(c, endPoint); }

		// If tangents between the current circle and the starting / ending point have been found, 
		// set the circle's starting point to either the top or bottom tangent intersection point, 
		// depending on whether it is located above or below the horizontal centerline. Below the 
		// centerline, the upper tangent is used, as the curve will be going clockwise (⤵). Above 
		// the centerline, and the lower tangent is used, as the curve will be going 
		// counter-clockwise (⤴). The revese is true for the ending point. 
		// 
		// If no tangents are found, then the starting / ending point is inside the circle. In this 
		// case, a new point is created above or below the circle's axis, depending on the winding
		// direction. The x axis position of this point is moved off screen either to the left or 
		// right, so that the path appears to continue off-screen.
		
		var ptCircleHi = { x: c.x, y: c.y - c.r };
		var ptCircleLo = { x: c.x, y: c.y + c.r };

		// Starting point tangents
		if (spTangents.length) {
			spTangents = spTangents.sort(function(a, b) { return a.y - b.y; });
			c.start = c.y > hh ? spTangents[0] : spTangents[1];
		} else if (neighborL === startPoint) {
			c.start = {
				x: startPoint.x - c.r,
				y: c.dir === 'cw' ? ptCircleHi.y : ptCircleLo.y
			};
		}

		// Ending point tangents
		if (epTangents.length) {
			epTangents = epTangents.sort(function(a, b) { return a.y - b.y; });
			c.end = c.dir === 'cw' ? epTangents[0] : epTangents[1];
		} else if (neighborR === endPoint) {
			c.end = {
				x: endPoint.x + c.r,
				y: c.dir === 'cw' ? ptCircleHi.y : ptCircleLo.y
			};
		}

		// In order to keep the path's direction visually consistant, any circles that are not
		// attached to the path's starting or ending points are set to the same winding direction
		// as their left neighbor. This only matters in the case of circles that are not attached to
		// the path's starting or ending points, as the direction of these circles are defined by 
		// their position on the y axis.
		if (!c.start && neighborL !== startPoint && neighborR !== endPoint) {
			c.dir = c.dir != neighborL.dir ? neighborL.dir : c.dir;
		}

		// If the circle is not attached to the starting or ending point, it will be missing either
		// an ending point or a starting point, respectively. If any circle-circle tangents are found
		// between the current circle and the left and right neighbors, these are used. The previous 
		// rules for deciding between the upper and lower tangents still apply. 
		// 
		// If no tangents are found, then the left or right neighbor is fully contained inside the
		// current circle. This case is handled similarly to the start / end point containment
		// case handled above.
		
		if (!c.start && ccLTangents) {
			c.start = c.dir === 'cw' ? ccLTangents[0][0] : ccLTangents[1][0];
		}	else if (!c.start) {
			c.start = c.dir === 'cw' ? ptCircleLo : ptCircleHi;
		}

		if (!c.end && ccRTangents) {
			c.end = c.dir === 'cw' ? ccRTangents[1][0] : ccRTangents[0][0];
		} else if (!c.end) {
			c.end = c.dir === 'cw' ? ptCircleLo : ptCircleHi;
		}

		// If this loop is inactive, it needs to be gracefully removed. This is done by easing the y 
		// axis value into a point on the line between the left and right neighbors where x = loop.x.
		// Special care is needed since the neighbors might not be circles with start and end values.
		var x0 = neighborL.end ? neighborL.end.x : neighborL.x;
		var y0 = neighborL.end ? neighborL.end.y : neighborL.y;
		var x1 = neighborR.start ? neighborR.start.x : neighborR.x;
		var y1 = neighborR.start ? neighborR.start.y : neighborR.y;
		var neighborDx = x1 - x0;
		var neighborDy = y1 - y1;
		var neighborDist = Math.sqrt(neighborDx * neighborDx + neighborDy * neighborDy);

		// Calculate the unit vector in the direction of the line between neighbors
		var u = Math.normalize({
			x: x1 - x0,
			y: y1 - y0
		});

		if (c.kill) {
			// Calculate the distance along the line the current circle is
			var dx = x0 - c.x;
			var dy = y0 - c.py;
			var d = Math.sqrt(dx * dx + dy * dy);

			// Maintain the x position of the circle, but ease the y axis value to a point on the 
			// line between neighbors offset by the distance given by the previous calculation.
			c.fy = y0 + d * u.y;
			c.y = smoothControl(c.y, c.fy, c, 'vy', smoothSpeed, 500, 1 / 60);

			// Calculate how complete the transition from c.py to c.fy is. This is used as the weight
			// of this portion of the path during b-spline interpolation.
			var initialDY = c.fy - c.py;
			var currentDY = c.fy - c.y;
			currentDY = Math.sign(currentDY > 0) ? 
					Math.min(initialDY, currentDY) : Math.max(initialDY, currentDY);
			weight = currentDY / initialDY;

			// Avoid crashing from a divide-by-zero 
			if (initialDY == 0) {
				weight = 1;
			}

			// Decrease circle's life once a certain weight value is reached.
			if (weight < 0.75) {
				c.life = smoothControl(c.life, -1, c, 'vL', smoothSpeed, 500, 1 / 60);
			}
		}

		// Figure out the starting and ending angles for the loop and plot a circle from the starting 
		// angle to the ending angle ± 2π, depending on the winding direction
		var dsx = c.start.x - c.x,
				dsy = c.start.y - c.y,
				dex = c.end.x - c.x,
				dey = c.end.y - c.y,
				sth = Math.atan2(dsy, dsx),
				eth = Math.atan2(dey, dex),
				dth = eth - sth,
				dth = c.dir === 'cw' ? dth + Math.TAU : dth - Math.TAU;

		var pendingPoints = [];
		var start = sth;
		var end = start + dth;
		var divisions = 6; 
		var th = 0;

		// Plot some points around the looped circle. A special less-than-or-equal comparison function 
		// is used to avoid floating point errors.
		while (Math.isAlmostLTE(Math.abs(th), Math.abs(dth), 0.0001)) {
			pendingPoints.push({
				x: Math.lerp(-c.r, +c.r, weight) * Math.cos(sth + th) + c.x,
				y: c.r * Math.sin(sth + th) + c.y
			});

			th += dth / divisions;
		}

		// Unwrap loops into sequences of points spaced evenly across the line defined by the left and 
		// right neighbors. Interpolate between these points and the loop points depending on the 
		// point weight.
		pendingPoints.forEach(function(p, i, a) {
			var j = i * neighborDist / a.length;
			var alignedX = x0 + j * u.x;
			var alignedY = y0 + j * u.y;
			p.x = Math.lerp(alignedX, p.x, weight);
			p.y = Math.lerp(alignedY, p.y, weight);
		});

		// Move the evenly-spaced line points to the left neighbor's end point, and delete them once
		// they get there. A staggered removal of loop points instead of removing 6+ points all at 
		// once will greatly reduce any visual glitches when loops are eventually deleted
		pendingPoints.forEach(function(p, i, a) {
			var interpT = Math.clamp(c.life + i / a.length, 0, 1);
			p.x = Math.lerp(x0, p.x, interpT);
			p.y = Math.lerp(y0, p.y, interpT);

			if (interpT > 0.1) {
				path.push(p);
			}
		});
	}); // end circleArray.forEach

	// Clean up any deleted circles which are too small to see
	deletedCircleArray.forEach(function(c) {
		if (c.kill && c.life < -0.98) {
			delete blobDetect.deletedCircles[c.key];
		}
	});

	// Path ends on the right middle edge
	path.push({x: anypixel.config.width, y: hh});

	return path;
}

/**
 * Calculates constant cubic easing towards a changing target value
 */
function smoothControl(current, target, circle, velocityParameter, smoothTime, maxSpeed, dt) {
	var vpr = velocityParameter;
	var t = 2 / smoothTime;
	var t2 = t * dt;
	var cubic = 1 / (1 + t2 + 0.48 * t2 * t2 + 0.235 * t2 * t2 * t2);
	var limit = maxSpeed * smoothTime;
	var error = Math.clamp(current - target, -limit, limit);
	var d = (circle[vpr] + t * error) * dt;
	circle[vpr] = (circle[vpr] - t * d) * cubic;
	return (current - error) + (d + error) * cubic;
}
