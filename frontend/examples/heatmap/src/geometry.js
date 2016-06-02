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

var gl = require('./gl');

/**
 * Provides a minimal wrapper for rendering a list of vertices as triangles.
 */
var Geometry = module.exports = function(vertices) {
  this.vertices = vertices;

  // Create the vertex buffer
  this.vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
  gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

/**
 * Renders the geometry with a given shader
 */
Geometry.prototype.renderWithShader = function(shader) {
  shader.use();

  // Bind vertex buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

  // Bind vertex buffer to the shader's 'position' attribute (slot 0)
  var aPosLoc = gl.getAttribLocation(shader.program, 'position');
  gl.enableVertexAttribArray(aPosLoc);
  gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, gl.FALSE, 0, 0);

  // Render
  gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);

  // Unbind vertex buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

/**
 * Returns an array of vertices corresponding to a quad of a given width and height. Defaults to 
 * a width and height of 1, which results in the quad covering the full viewport.
 */
Geometry.FullscreenQuad = function(w, h) {
  w = w === undefined ? 1 : w;
  h = h === undefined ? w : h;

  // return new Float32Array([-w,-h, 0,0, w,-h, w,0, -w,h, 0,h, w,h, w,h]);

  return new Float32Array([
    -w, h, 0,  -w, -h, 0,   w, -h, 0,  // First triangle
    -w, h, 0,   w, -h, 0,   w,  h, 0   // Second triangle
  ]);
};