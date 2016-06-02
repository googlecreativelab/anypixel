/**
 * Computes the inner and outer tangent lines between two circles.
 * From https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Tangents_between_two_circles
 * Ported from the original Java implementation.
 */

/**
 * Finds tangent segments between two given circles.
 *
 * Returns an empty, or 2x4, or 4x4 array of doubles representing
 * the two exterior and two interior tangent segments (in that order).
 * If some tangents don't exist, they aren't present in the output.
 * Each segment is represent by a 4-tuple x1,y1,x2,y2.
 * 
 * Exterior tangents exist iff one of the circles doesn't contain
 * the other. Interior tangents exist iff circles don't intersect.
 *
 * In the limiting case when circles touch from outside/inside, there are
 * no interior/exterior tangents, respectively, but just one common
 * tangent line (which isn't returned at all, or returned as two very
 * close or equal points by this code, depending on roundoff -- sorry!)
 *
 * Java 6 (1.6) required, for Arrays.copyOf()
 */
Math.circleCircleTangents = function(c1, c2) {
  var dx = c1.x - c2.x,
      dy = c1.y - c2.y,
      dr = c1.r - c2.r,
      dsq = dx * dx + dy * dy;

  if (dsq <= dr * dr) return null;

  var d = Math.sqrt(dsq);
      vx = (c2.x - c1.x) / d,
      vy = (c2.y - c1.y) / d;

  var result = [];

  // Let A, B be the centers, and C, D be points at which the tangent
  // touches first and second circle, and n be the normal vector to it.
  //
  // We have the system:
  //   n * n = 1          (n is a unit vector)          
  //   C = A + r1 * n
  //   D = B +/- r2 * n
  //   n * CD = 0         (common orthogonality)
  //
  // n * CD = n * (AB +/- r2*n - r1*n) = AB*n - (r1 -/+ r2) = 0,  <=>
  // AB * n = (r1 -/+ r2), <=>
  // v * n = (r1 -/+ r2) / d,  where v = AB/|AB| = AB/d
  // This is a linear equation in unknown vector n.

  for (var sign1 = +1; sign1 >= -1; sign1 -= 2) {
    var c = (c1.r - sign1 * c2.r) / d;

    // Now we're just intersecting a line with a circle: v*n=c, n*n=1

    if (c * c > 1) continue;
    var h = Math.sqrt(Math.max(0, 1 - c * c));

    for (var sign2 = +1; sign2 >= -1; sign2 -= 2) {
      var nx = vx * c - sign2 * h * vy,
          ny = vy * c + sign2 * h * vx;

      var p1 = {
        x: c1.x + c1.r * nx,
        y: c1.y + c1.r * ny
      };

      var p2 = {
        x: c2.x + sign1 * c2.r * nx,
        y: c2.y + sign1 * c2.r * ny
      };

      result.push([p1, p2]);
    }
  }

  return result;
}