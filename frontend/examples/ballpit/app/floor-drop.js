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

var scheduler    = require('./scheduler');

const DEBUG = false;

var ctx;

if(DEBUG){
    let canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = 140;
    canvas.height = 42;

    document.body.appendChild(canvas);
    Object.assign(canvas.style, {
        position: 'absolute',
        bottom: '50px',
        left: '50px'
    });

    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,canvas.width, canvas.height);
}

function surfaceArea(bodies){
    var area = 0;
    for(var i=0; i<bodies.length; i++){
        for(var j=0; j<bodies[i].shapes.length; j++){
            var sh = bodies[i].shapes[j];
            area += sh.area;
        }
    }
    return area;
}


function isOffscreen(floor, body){
    var flTop = floor.position[1] - (floor.shapes[0].height/2),
        flLeft = floor.position[0] - (floor.shapes[0].width / 2),
        flRight = floor.position[0] + (floor.shapes[0].width / 2);

    for(var j=0; j<body.shapes.length; j++){
        var s = body.shapes[j],
            sX = body.position[0] + s.position[0],
            sY = body.position[1] + s.position[1];

        if(DEBUG){
            ctx.fillStyle = body.isLetter ? 'lime' : 'purple';
            ctx.fillRect(sX-4, sY-4, 8, 8);
        }

        if(sX < flLeft || sX > flRight || sY - s.radius > flTop){
            return true;
        }
    }

    return false;
}

function makeFloorDrop(world, floor, bodies){

    var exp = scheduler();

    var shouldCycle = exp.shouldCycle;
    exp.shouldCycle = ()=>
        shouldCycle() || tooFull();

    var shouldStop = exp.shouldStop;
    exp.shouldStop = ()=>
        shouldStop() && !tooFull();

    exp.minSurfaceArea = 0;
    exp.maxSurfaceArea = 0;

    function tooFull(){
        return surfaceArea(bodies) > exp.maxSurfaceArea;
    }


    function cleanUnderFloor(){

        if(DEBUG){
            ctx.fillStyle = 'black';
            ctx.fillRect(0,0,canvas.width, canvas.height);
        }

        var offscreen = bodies.filter(b=>isOffscreen(floor,b));

        //will this operation result in removing bodies?
        var removedBodiesLen = offscreen.length;

        while(offscreen.length){
            let next = offscreen.shift();
            world.removeBody(next);
            bodies.splice(bodies.indexOf(next), 1);
        }

        if(removedBodiesLen){
            //anounce that bodies were removed
            exp.emit('clean', removedBodiesLen, bodies);
        }
    }

    exp
        .on('start', ()=>{
            //there may have been a body that fell under the floor after
            //it was stopped, that would cause this to count it as surface-area
            cleanUnderFloor();

            world.removeBody(floor);

            //refuse to drop the floor if the surface area isnt above the minimum
            if(surfaceArea(bodies) < exp.minSurfaceArea){
                exp.reset();
            }
        })
        //if its too full try to clean under the floor every frame until it isnt
        .on('update',()=>(tooFull() && cleanUnderFloor()))
        .on('clean',(n)=>console.log('clean - removed ' +n+ ', ' +bodies.length+ ' remain'))
        .on('stop',()=>{
            cleanUnderFloor();
            world.addBody(floor);
        });


    return exp;
}


module.exports = makeFloorDrop;

