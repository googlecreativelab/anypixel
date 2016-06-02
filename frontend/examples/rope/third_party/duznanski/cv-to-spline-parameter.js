/**
 * From https://gist.github.com/DUznanski/ebdca354df614e78b4cd69fb13e138c3
 * See also: http://davis.wpi.edu/~matt/courses/biomed/reparam.htm
 */

/** 
 * Convert a parameter to a fake constant-velocity parameterization of a
 * spline into a real parameter for that spline.
 *
 * segments: a list of accumulated segment lengths
 * 
 * u: the parameter into the fake parameterization, in the range [0, 1].
 *
 * returns: a parameter for the real spline.
 */
module.exports = function(u, segments) {
	var t = 0;	

	// Special case: u = 1 will land us in a place where there's no next segment. Fortunately, 
	// it's trivial.
	if (u == 1) {
		return 1;
	} else {
		// Convert u from 0..1 to the space given by the curve. The last index of the array 
		// corresponds to the arc length of the curve
		var segmentCount = segments.length - 1;
		var d = u * segments[segmentCount];
		var k = 0;

		// Find the place in the segment distance list where d is
		while (segments[k] < d) {
			k++;
		}

		// We overshoot, so go back one
		k = Math.max(0, --k);
		var lo = segments[k];
		var hi = segments[k + 1];

		// Find out how far we've gone along the segment defined by the current and previous points
		var segmentIndex = (d - lo) / (hi - lo);
		var totalSegmentsPassed = k + segmentIndex;
		return totalSegmentsPassed / segmentCount;
	}
}