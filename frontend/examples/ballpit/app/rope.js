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

var p2 = require('p2'),
    animitter = require('animitter');


exports.makeBodies = function makeRopeBodies(n, getX, getY){

    var bodies = [];
    for(var i=0; i<n; i++){

        var _x = getX(i, n),
            _y = getY(i, n);

        var body = new p2.Body({
            mass: i===0 ? 0 : i===n-1 ? 2 : 0.02,
            position: [ _x, _y ],
            //angularDamping: 0.95
        });

        if(i===0){
            //set a horizontal velocity on the last body
            //body.velocity[0] = 1;
        }

        bodies.push(body);
    }

    return bodies;
};

exports.makeConstraints = function makeRopeConstraints(bodies){
    var constraints = [];
    for(var i=1; i<bodies.length; i++){
        var last = bodies[i-1],
            current = bodies[i];

        var c = new p2.DistanceConstraint( last, current, {
            distance: Math.abs(current.position[1] - last.position[1]),
            maxForce: 100
        });

        c.setRelaxation(0.5);
        c.setStiffness(5500);

        constraints.push(c);

    }

    return constraints;
};




//Create a rope of constraints
module.exports = function rope(n, getX, getY){
    var bodies = exports.makeBodies(n, getX, getY),
        constraints = exports.makeConstraints(bodies),
        loop = animitter(),
        _isTorn = false,
        _isRemoved = false,
        _world;



    var maxConstraintStress = 100000;

    var stress = constraints.map(c=>0);

    bodies[bodies.length-3].velocity[0] = Math.random() * 0.2;


    loop.on('update', function onPostStep(){
        for(var i=0; i<constraints.length; i++){
            var c = constraints[i],
                eqs = c.equations;

            var latestStress = Math.abs(eqs[0].multiplier);
            stress[i] += latestStress;
            //if(stress[i] > maxConstraintStress && latestStress > 100){

            //Equation mult is the mag of force
            if(Math.abs(eqs[0].multiplier) > 100){
                //force is too large… tear (remove)
                _isTorn = true;
                constraints.forEach(c=>_world.removeConstraint(c));
                loop.off('update', onPostStep);
                /*var body = bodies.splice(bodies.indexOf(constraints[0].bodyA), 1);
                _world.removeBody(body);*/
                constraints = [];
                /*_world.removeConstraint(c);
                constraints.splice(constraints.indexOf(c), 1);*/
            }
        }
    });

    return {

        isRemoved: ()=>_isRemoved,
        isTorn: ()=>_isTorn,
        bodies: bodies,
        constraints: constraints,
        initTearing: (world)=>{
            _world = world;
            loop.start();
        },
        stopTearing: ()=> loop.stop(),
        remove: ()=>{
            loop.stop();
            _isRemoved = true;
            constraints.forEach(c=>_world && _world.removeConstraint(c));
            bodies.forEach(b=>_world && _world.removeBody(b));
        }
    };

};

