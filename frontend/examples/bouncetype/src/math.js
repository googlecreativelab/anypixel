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

Math.isAlmostLessThan = function(a, b, epsilon) {
  return (a - b < epsilon && Math.abs(a - b) > epsilon);
}

Math.isAlmostGreaterThan = function(a, b, epsilon) {
  return (a - b > epsilon && Math.abs(a - b) > epsilon);
}

Math.isAlmostLTE = function(a, b, epsilon) {
  return Math.isAlmostLessThan(a, b, epsilon) || Math.isAlmostEqual(a, b, epsilon);
}

Math.isAlmostGTE = function(a, b, epsilon) {
  return Math.isAlmostGreaterThan(a, b, epsilon) || Math.isAlmostEqual(a, b, epsilon);
}

Math.isAlmostEqual = function(a, b, epsilon) {
  var absA = Math.abs(a);
  var absB = Math.abs(b);
  var diff = Math.abs(a - b);

  if (a == b) {
    return true;
  } else if (a == 0 || b == 0 || diff < Number.EPSILON) {
    return diff < (epsilon * Number.EPSILON);
  } else {
    return diff / (absA + absB) < epsilon;
  }
}

Math.randomRange = function(min, max) {
  return Math.random() * (max - min) + min;
}