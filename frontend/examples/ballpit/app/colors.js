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

exports.list = [
    [66, 133, 244],
    [52, 168, 83],
    [251, 188, 5],
    [255, 9, 20]
];

exports.toCSS = (arr)=>'rgb('+arr[0]+', '+arr[1]+', '+arr[2]+')';

/**
 * are the two colors similar enough to each other to be within the tolerance
 * @param {Array} cA first color
 * @param {Array} cB second color
 * @param {Number} tol the tolerance to be within
 * @return {Boolean}
 */
exports.equalWithTolerance = (cA, cB, tol)=>difference(cA, cB) < tol;

function difference(a, b) {
    var diff = 0;
    for(var i=0; i<a.length; i++){
        diff += Math.abs(a[i] - b[i]);
    }
    return diff;
}

/**
* get a random element from an array,
* but dont repeat the last one
*/
exports.getRandom = ((arr)=>{
    var lastSampleIndex = -1;
    return function sample(){
        var i = -1;
        if(arr.length > 1){
            while(i < 0 || i === lastSampleIndex){
                i = Math.floor(Math.random()*arr.length)
            }
        } else {
            i = 0;
        }
        lastSampleIndex = i;
        return arr[i];
    };
})(exports.list);

