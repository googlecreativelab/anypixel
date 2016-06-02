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
    rope      = require('./rope'),
    letters   = require('./letters'),
    ease      = require('eases/quad-out');


/**
 * the exported module definition
 * a `scheduler` loop for maintaining the logo
 * @param {p2.World} world
 * @param {Array<p2.Bodies>} the global bodies array to share
 * @return {./scheduler}
 */
function logo(world, bodies){
    var exp        = scheduler(),
        ropes      = [],
        ropeShapes = [];


    exp.set({
        enableTearingDelay: 8000
    });

    //build on top of schedulers basic `shouldStop`
    var shouldStop = exp.shouldStop;

    /**
     * if the scheduler has met a condition where the loop should stop
     * @param {Boolean}
     */
    exp.shouldStop = ()=>{
        var should = shouldStop();
        for(var i=0; i<ropes.length; i++){
            if(should && ropes[i].isTorn()){
                return true;
            }
        }

        return false;
    };

    /**
     * get the all of the shapes, flattened
     * @param {Array<p2.Circle>}
     */
    exp.getLetterShapes = ()=> ropeShapes;

    var flattenPieces = (mem, val)=> mem.concat(val);

    exp.on('start', ()=>{
        //when the scheduler is started,
        //look for any missing letters and repair them, create all on first round
        for(var i=0; i<letters.length; i++){
            if(!ropes[i] || ropes[i].isTorn()){  //&& ropes[i].isRemoved()){

                //if ropes[i] exists, stop its loop
                //and remove it from the pool
                if(ropes[i]){
                    ropes[i].bodies.forEach(b=>{
                        var i = bodies.indexOf(b);
                        if( i > -1 ){
                            bodies.splice(i, 1);
                        }
                    });
                    ropes[i].remove();
                }

                ropes[i] = makeLetterRope(world, letters[i]);
            }
        }

        var ropePieces = ropes.map((rp, i)=>makeRopePieces(rp, letters[i]));

        ropePieces = ropePieces.reduce(flattenPieces, []);
        ropeShapes = ropePieces.map((r)=>r.shapes).reduce(flattenPieces,[]);
        ropeBodies = ropePieces.map(r=>r.bodies).reduce(flattenPieces, []);

        //add them to the global bodies list as well
        ropeBodies.forEach(b=>bodies.push(b));

        //initialize ropes being able to be torn apart
        setTimeout(()=>
            ropes.forEach(r=>r.initTearing(world)),
            exp.enableTearingDelay
        );
    });

    exp.on('update', ()=>{
        for(var i=0; i<ropeShapes.length; i++){
            var shape = ropeShapes[i];
            var prog = shape.goalProgress;
            if(prog < 1){
                shape.radius = shape.goalRadius * ease(prog);
                shape.updateBoundingRadius();
                shape.updateArea();
                shape.goalProgress += 0.01;
            }
        }
    });

    exp.removeTorn = ()=>{
        for(var i=0; i<ropes.length; i++){
            if(ropes[i].isTorn()){
                ropes[i].stopTearing();
            }
        }
    };



    return exp;

}

function makeRopePieces(rp, letter){
    var shapes = [];
    var bodies = [];
    rp.bodies.forEach((b, i, arr)=>{
        if(i < arr.length - letter.shapes.length){
            return;
        }

        //the parameters for a single shape of a letter
        var shapeParams = letter.shapes[arr.length - 1 - i];

        var sh = new p2.Circle({
            radius: 0,
        });

        sh.goalProgress = 0;
        sh.goalRadius = shapeParams.radius;

        sh.color = shapeParams.color;

        b.addShape(sh, shapeParams.position);

        //distinguish this body as belonging to a letter
        b.isLetter = true;

        bodies.push(b);
        shapes.push(sh);
    });

    return {
        shapes: shapes,
        bodies: bodies
    };
};

        //shape.radius += 0.125;


function makeLetterRope(world, letter){
    let rp = rope(letter.links, letter.getX, letter.getY);
    rp.bodies.forEach(b=>world.addBody(b));
    rp.constraints.forEach(c=>world.addConstraint(c));
    return rp;
}

module.exports = logo;
