/**
 * From http://csharphelper.com/blog/2014/08/find-a-minimal-bounding-circle-of-a-set-of-points-in-c/
 * Ported from C# to javascript
 */

var ConvexHull = require('./convex-hull');

/**
 * Finds the minimum bounding circle of a given set of points
 */
module.exports = function(points) {
	// Find the convex hull
	var hull = ConvexHull.create(points);

	// The best solution so far
	var bestCenter = points[0];
	var bestRadius = Infinity;

	// Look at pairs of hull points
	for (var i = 0; i < hull.length - 1; i++) {
		for (var j = i + 1; j < hull.length; j++) {

			// Find the circle through these two points
			var testCenter = {
				x: (hull[i].x + hull[j].x) / 2,
				y: (hull[i].y + hull[j].y) / 2
			};

			var dx = testCenter.x - hull[i].x;
			var dy = testCenter.y - hull[i].y;
			var testRadius = dx * dx + dy * dy;

			// See if this circle would be an improvement
			if (testRadius < bestRadius) {

				// See if this circle encloses all of the points
				if (circleEnclosesPoints(testCenter, testRadius, hull, i, j, -1)) {
					bestCenter = testCenter;
					bestRadius = testRadius;
				}
			}
		}
	}

	// Look at the triples of hull points
	for (var i = 0; i < hull.length - 2; i++) {
		for (var j = i + 1; j < hull.length - 1; j++) {
			for (var k = j + 1; k < hull.length; k++) {

				// Find the circle through these three points
				var testCircle = findCircleThreePoints(hull[i], hull[j], hull[k]);
				var testCenter = {x: testCircle.x, y: testCircle.y};
				var testRadius = testCircle.radius;

				// See if this circle would be an improvement
				if (testCircle.radius < bestRadius) {

					// See if this circle encloses all of the points
					if (circleEnclosesPoints(testCenter, testRadius, hull, i, j, k)) {
						bestCenter = testCenter;
						bestRadius = testRadius;
					}
				}
			}
		}
	}

	if (bestRadius == Infinity) {
		bestRadius = 0;
	} else {
		bestRadius = Math.sqrt(bestRadius);
	}

	return {
		x: bestCenter.x,
		y: bestCenter.y,
		r: bestRadius
	};
}

/**
 * Returns true if the given circle encloses the given points
 */
function circleEnclosesPoints(center, radius, points, skip1, skip2, skip3) {
	for (var i = 0; i < points.length; i++) {
		if (i !== skip1 && i !== skip2 && i !== skip3) {
			var point = points[i];
			var dx = center.x - point.x;
			var dy = center.y - point.y;
			var testRadius = dx * dx + dy * dy;
			if (testRadius > radius) {
				return false;
			}
		}
	}
	return true;
}

/**
 * Returns a circle through the given three points
 */
function findCircleThreePoints(a, b, c) {
	// Get the perpendicular bisector of a and b
	var x1 = (b.x + a.x) / 2,
			y1 = (b.y + a.y) / 2,
			dy1 = b.x - a.x,
			dx1 = -(b.y - a.y);

	// Get the perpendicular bisector of b and c
	var x2 = (c.x + b.x) / 2,
			y2 = (c.y + b.y) / 2,
			dy2 = c.x - b.x,
			dx2 = -(c.y - b.y);

	var p1 = {x: x1, y: y1};
	var p2 = {x: x1 + dx1, y: y1 + dy1};
	var p3 = {x: x2, y: y2};
	var p4 = {x: x2 + dx2, y: y2 + dy2};

	// Get the line intersections
	var center = findIntersection(p1, p2, p3, p4);
	var dx = center.x - a.x;
	var dy = center.y - a.y;

	return {
		x: center.x,
		y: center.y,
		radius: dx * dx + dy * dy
	};
}

/**
 * Finds the point of intersection between the lines p1 --> p2 and p3 --> p4. Returns false if the 
 * lines are parallel.
 */
function findIntersection(p1, p2, p3, p4) {
	// Get the segments' parameters
	var dx12 = p2.x - p1.x,
			dy12 = p2.y - p1.y,
			dx34 = p4.x - p3.x,
			dy34 = p4.y - p3.y;
	
	// Return false if the lines are parallel
	var denominator = dy12 * dx34 - dx12 * dy34;
	if (denominator === 0) {
		return false;
	}

	// Solve for t1
	var t1 = ((p1.x - p3.x) * dy34 + (p3.y - p1.y) * dx34) /  denominator;

	// Return the point of intersection
	return {
		x: p1.x + dx12 * t1,
		y: p1.y + dy12 * t1
	};
}