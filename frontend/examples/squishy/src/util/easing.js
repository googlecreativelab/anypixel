
/*
Copyright 2016 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var Ease = function(type, time) {
    switch(type) {
    	case 'easeInQuad':      return time * time; // accelerating from zero velocity
    	case 'easeOutQuad':     return time * (2 - time); // decelerating to zero velocity
    	case 'easeInOutQuad':   return time < 0.5 ? 2 * time * time : -1 + (4 - 2 * time) * time; // acceleration until halfway, then deceleration
    	case 'easeInCubic':     return time * time * time; // accelerating from zero velocity
    	case 'easeOutCubic':    return (--time) * time * time + 1; // decelerating to zero velocity
    	case 'easeInOutCubic':  return time < 0.5 ? 4 * time * time * time : (time - 1) * (2 * time - 2) * (2 * time - 2) + 1; // acceleration until halfway, then deceleration
    	case 'easeInQuart':     return time * time * time * time; // accelerating from zero velocity
    	case 'easeOutQuart':    return 1 - (--time) * time * time * time; // decelerating to zero velocity
    	case 'easeInOutQuart':  return time < 0.5 ? 8 * time * time * time * time : 1 - 8 * (--time) * time * time * time; // acceleration until halfway, then deceleration
    	case 'easeInQuint':     return time * time * time * time * time; // accelerating from zero velocity
    	case 'easeOutQuint':    return 1 + (--time) * time * time * time * time; // decelerating to zero velocity
    	case 'easeInOutQuint':  return time < 0.5 ? 16 * time * time * time * time * time : 1 + 16 * (--time) * time * time * time * time; // acceleration until halfway, then deceleration
    	default:                return time;
    }
};

module.exports = Ease;
