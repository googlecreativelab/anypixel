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

/**
 * Provides a simple one-dimensional spring simulation. Damping, mass, and k values are constants
 * which have been tuned to feel nice at 60fps.
 */
var spring = module.exports = function(initialValue) {
	this.divisor = 1000;
	this.prevValue = initialValue * this.divisor;
	this.value = this.prevValue;
	this.velocity = 0;
	this.damping = 0.8;
	this.mass = 9;
	this.k = 0.95;
}

/**
 * Advances the simulation by one step using the Euler method. This does not account for changes in 
 * the framerate, but that's fine for this application.
 */
spring.prototype.update = function () {
	var f = this.value - this.prevValue;
	f *= -this.k;

	this.velocity += f / this.mass;
	this.velocity *= this.damping;

	this.value += Math.floor(this.velocity);
}

/**
 * Sets the spring's target value
 */
spring.prototype.setValue = function(v) {
	this.prevValue = Math.ceil(v * this.divisor);
}

/**
 * Returns the spring value divided by the divisor
 */
spring.prototype.getValue = function() {
	return this.value / this.divisor;
}