
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


"use strict";

var LiquidRenderer = function(scene,world) {
  // init large buffer geometry

  this.scene = scene;
  this.world = world;

	let maxVertices = new Float32Array( 31000 );
	let geometry = new THREE.BufferGeometry();
  		geometry.dynamic = true;
  		geometry.addAttribute('position', new THREE.BufferAttribute( maxVertices, 3 ));
  		geometry.addAttribute('color', new THREE.BufferAttribute( maxVertices, 3 ));

  this.positions = geometry.attributes.position.array;
  this.colors = geometry.attributes.color.array;
  this.currentVertex = 0;
  this.buffer = new THREE.Line(geometry, new THREE.LineBasicMaterial({ vertexColors: true }), THREE.LineSegments);

  this.circleVertices = [];
  this.circleResolution = 5;
  this.initCircleVertices(this.circleVertices, this.circleResolution);

  this.particleVertices = [];
  this.particleResolution = 3;
  this.initCircleVertices(this.particleVertices, this.particleResolution);

  scene.add(this.buffer);
}

LiquidRenderer.prototype.initCircleVertices = function(v, resolution) {
  var size = 360 / resolution;

  for (var i = 0; i < resolution; i++) {
    var s1 = (i * size) * Math.PI / 180;
    var s2 = ((i + 1) * size) * Math.PI / 180;
    v.push(Math.cos(s1));
    v.push(Math.sin(s1));
    v.push(Math.cos(s2));
    v.push(Math.sin(s2));
  }
};

LiquidRenderer.prototype.draw = function() {
  for (var i = 0, max = this.world.bodies.length; i < max; i++) {
    var body = this.world.bodies[i];
    var maxFixtures = body.fixtures.length;
    var transform = body.GetTransform();
    for (var j = 0; j < maxFixtures; j++) {
      var fixture = body.fixtures[j];
      fixture.shape.draw(transform);
    }
  }
}


module.exports = LiquidRenderer;
