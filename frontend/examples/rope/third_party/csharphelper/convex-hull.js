/**
 * From http://csharphelper.com/blog/2014/07/find-the-convex-hull-of-a-set-of-points-in-c/
 * Ported from C# to javascript
 */

var ConvexHull = module.exports = {};

/**
 * Returns a list of points that consists of the convex hull of a given set of points
 */
ConvexHull.create = function(points) {
	points = hullCull(points);

	// Find the point with the smallest y value. If there's a tie, take the one with the smaller 
	// x value.
	var bestPt = points[0];
	points.forEach(function(pt) {
		if (pt.y < bestPt.y || (pt.y == bestPt.y && pt.x < bestPt.x)) {
			bestPt = pt;
		}
	});

	// Remove this point from the points list
	points = points.filter(function(pt) {
		return pt !== bestPt;
	});

	// Move this point to the convex hull
	var hull = [bestPt];

	var sweepAngle = 0;
	for (;;) {

		// If all the points are in the hull, we're done
		if (points.length == 0) break;

		// Find the point with the smallest angleValue from the last point
		var x = hull[hull.length - 1].x;
		var y = hull[hull.length - 1].y;
		bestPt = points[0];
		var bestAngle = 3600;

		// Search the rest of the points
		points.forEach(function(pt) {
			var testAngle = angleValue(x, y, pt.x, pt.y);
			if (testAngle >= sweepAngle && bestAngle > testAngle) {
				bestAngle = testAngle;
				bestPt = pt;
			}
		});

		// See if the first point is better. If so, we're done
		var firstAngle = angleValue(x, y, hull[0].x, hull[0].y);
		if (firstAngle >= sweepAngle && bestAngle >= firstAngle) {
			break;
		}

		// Add the best point to the hull
		hull.push(bestPt);

		points = points.filter(function(pt) {
			return pt !== bestPt;
		});

		sweepAngle = bestAngle;
	}

	return hull;
}

/**
 * Finds the points nearest to the upper left, upper right, lower left, and lower right corners
 */
function getMinMaxCorners(points) {
	var ul = points[0],
			ur = points[0],
			ll = points[0],
			lr = points[0];

	points.forEach(function(p) {
		if (-p.x - p.y > -ul.x - ul.y) ul = p;
		if ( p.x - p.y >  ur.x - ur.y) ur = p;
		if (-p.x + p.y > -ll.x + ll.y) ll = p;
		if ( p.x + p.y >  lr.x + lr.y) lr = p;
	});

	return { ul: ul, ur: ur, ll: ll, lr: lr };
}

/**
 * Finds the rectangle that fits inside the min-max quadrilateral
 */
function getMinMaxRect(points) {
	// Find the min-max quadrilateral
	var corners = getMinMaxCorners(points);

	// Get the coordinates of a rectangle that lies inside the quadrilateral
	var xmin, xmax, ymin, ymax;
	xmin = corners.ul.x;
	ymin = corners.ul.y;

	xmax = corners.ur.x;
	if (ymin < corners.ur.y) ymin = corners.ur.y;

	if (xmax > corners.lr.x) xmax = corners.lr.x;
	ymax = corners.lr.y;

	if (xmin < corners.ll.x) xmin = corners.ll.x;
	if (ymax > corners.ll.y) ymax = corners.ll.y;

	return {
		x: xmin, 
		y: ymin,
		width: xmax - xmin,
		height: ymax - ymin
	};
}

/**
 * Cull points out of the convex hull that lie inside the trapezoid defined by the vertices of the
 * smallest and largest x and y coordinates.
 */
function hullCull(points) {
	var cullingRect = getMinMaxRect(points);

	return points.filter(function(p) {
		return (
				p.x <= cullingRect.x || p.x >= cullingRect.x + cullingRect.width ||
				p.y <= cullingRect.y || p.y >= cullingRect.y + cullingRect.height);
	});
}

function angleValue(p1, p2) {
	var dx, dy, ax, ay, t;

	dx = p2.x - p1.x;
	ax = Math.abs(dx);
	dy = p2.y - p1.y;
	ay = Math.abs(dy);

	if (ax + ay === 0) {
		t = 360 / 9;
	} else {
		t = dy / (ax + ay);
	}

	if (dx < 0) {
		t = 2 - t;
	} else if (dy < 0) {
		t = 4 + t;
	}

	return t * 90;
}