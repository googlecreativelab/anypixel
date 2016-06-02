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

var Shader = module.exports = function(vertScript, fragScript) {
  this.program = this.createAndLinkProgram(vertScript, fragScript);
  this.uniformValues = {};
}

/**
 * Alias to gl.useProgram
 */
Shader.prototype.use = function() {
  gl.useProgram(this.program);
}

/**
 * Sets a single uniform value in a given shader program.
 */
Shader.prototype.setUniform = function(type, name, value) {
  var location = gl.getUniformLocation(this.program, name);

  // Prevent duplicating texture slots
  if (type === 't') {
    if (!value.equals(this.uniformValues[name])) {
      value.uniform(location);
      value.set(this.uniformValues, name);
    }
    return;
  }

  switch (type) {
    case '1i':  gl.uniform1i(location, value); break;
    case '1f':  gl.uniform1f(location, value); break;
    case '2f':  gl.uniform2f(location, value[0], value[1]); break;
    case '3f':  gl.uniform3f(location, value[0], value[1], value[2]); break;
    case '4f':  gl.uniform4f(location, value[0], value[1], value[2], value[3]); break;
    case '1iv': gl.uniform1iv(location, value); break;
    case '3iv': gl.uniform3iv(location, value); break;
    case '1fv': gl.uniform1fv(location, value); break;
    case '2fv': gl.uniform2fv(location, value); break;
    case '3fv': gl.uniform3fv(location, value); break;
    case '4fv': gl.uniform4fv(location, value); break;
    case 'Matrix3fv': gl.uniformMatrix3fv(location, false, value); break;
    case 'Matrix4fv': gl.uniformMatrix4fv(location, false, value); break;
    default: console.log('unknown type ' + type); break;
  }
}

/**
 * Sets multiple uniform values for a given shader program
 */
Shader.prototype.setUniforms = function(uniforms) {
  gl.useProgram(this.program);

  for (var uniformName in uniforms) {
    var uniform = uniforms[uniformName];
    this.setUniform(uniform.type, uniformName, uniform.value);
  }
}

/**
 * Compiles a shader script into either a vertex shader or a fragment shader
 */
Shader.prototype.getShader = function(shaderSource, shaderType) {
  var shader = gl.createShader(shaderType);

  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  // Log any errors
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(shader));
    console.log(shaderSource);
    return null;
  }

  return shader;
}

/**
 * Creates a shader program from separate vertex and fragment shader scripts
 */
Shader.prototype.createAndLinkProgram = function(vertScript, fragScript) {
  var program = gl.createProgram();

  var vert = this.getShader(vertScript, gl.VERTEX_SHADER);
  var frag = this.getShader(fragScript, gl.FRAGMENT_SHADER);

  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);

  // Log any errors
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(gl.getProgramInfoLog(program))
    return null;
  }

  return program;
}
