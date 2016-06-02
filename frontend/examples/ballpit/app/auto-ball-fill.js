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

var p2        = require('p2'),
    scheduler = require('./scheduler'),
    rand      = require('./random-range');


function addBall(opts){
    opts = opts || {};
    opts.radius = opts.radius || rand(1, 3);
    opts.mass = opts.mass || opts.radius * 2;

    if(!opts.position){
        throw new Error('addBall requires a opts.position Array');
    }

    if(!opts.color){
        throw new Error('addBall requires an opts.color string');
    }
    //opts.position = opts.position || [ Math.random() * dim.width, -opts.radius ];

    var body = new p2.Body(opts);
    var shape = new p2.Circle({ radius: opts.radius });
    shape.color = opts.color;

    body.velocity = opts.velocity || [ rand(-1, -0.5), 0];

    body.addShape(shape);

    return body;
}


/**
 * Create a scheduler that adds balls into the pit
 * @param {p2.World} world
 * @param {Array<p2.Body>} bodiesPool
 * @param {Function(ballsAdded:Number):Object} getBallOptions a function that
 * returns an object for the properties of the new ball to be added.
 * @return {./scheduler}
 */
function makeAutoBallFill(world, bodiesPool, getBallOptions){

    var exp = scheduler();

    var ballsAdded = 0;

    /**
     * how many frames should play for every time a ball is dropped
     * @type {Number}
     */
    exp.addBallFrameInterval = 60;

    exp.on('update', (delta, elapsed, frameCount)=>{
        if(frameCount % exp.addBallFrameInterval === 0){
            var options = getBallOptions(ballsAdded);
            //maintain the bodies in the global array of bodies
            var ball = addBall(options);
            bodiesPool.push(ball);
            world.addBody(ball);
            ballsAdded++;
        }
    });

    exp.on('reset',()=>ballsAdded = 0);


    return exp;
}

module.exports = makeAutoBallFill;

