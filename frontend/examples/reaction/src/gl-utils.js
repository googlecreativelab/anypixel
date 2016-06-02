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

var glUtils = module.exports = {};

/**
 * Creates a uv-mapped display surface for a given shader program
 */
glUtils.prepareSurface = function(gl, outputProgram, vertPosName, vertTexCoordName) {
	var posBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

	var vertices = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);

	var aPosLoc = gl.getAttribLocation(outputProgram, vertPosName);
	gl.enableVertexAttribArray(aPosLoc);

	var aTexLoc = gl.getAttribLocation(outputProgram, vertTexCoordName);
	gl.enableVertexAttribArray(aTexLoc);

	var texCoords = new Float32Array([ 0, 0, 1, 0, 0, 1, 1, 1 ]);
	var texCoordOffset = vertices.byteLength;

	gl.bufferData(gl.ARRAY_BUFFER, texCoordOffset + texCoords.byteLength, gl.STATIC_DRAW);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
	gl.bufferSubData(gl.ARRAY_BUFFER, texCoordOffset, texCoords);
	gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, gl.FALSE, 0, 0);
	gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, gl.FALSE, 0, texCoordOffset);
}

/**
 * Compiles a shader script into either a vertex shader or a fragment shader
 */
glUtils.getShader = function(gl, shaderScript, shaderType) {
	var shader = gl.createShader(shaderType);

	gl.shaderSource(shader, shaderScript);
	gl.compileShader(shader);

	// Log any errors
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.log(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

/**
 * Creates a shader program from separate vertex and fragment shader scripts
 */
glUtils.createAndLinkProgram = function(gl, vertScript, fragScript) {
	var program = gl.createProgram();

	var vert = glUtils.getShader(gl, vertScript, gl.VERTEX_SHADER);
	var frag = glUtils.getShader(gl, fragScript, gl.FRAGMENT_SHADER);

	gl.attachShader(program, vert);
	gl.attachShader(program, frag);
	gl.linkProgram(program);
	return program;
}

/**
 * Creates a texture and binds it to a WebGLFramebuffer object.
 */
glUtils.createAndBindTexture = function(gl, glPixels, sizeX, sizeY, fbo, options) {
	var opts = options || {};
	var minFilter = opts.minFilter || opts.filter || gl.LINEAR;
	var magFilter = opts.magFilter || opts.filter || gl.LINEAR;
	var wrap = opts.wrap || gl.REPEAT;
	var format = opts.format || gl.RGBA;
	var type = opts.formatType || gl.UNSIGNED_BYTE;

	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	gl.texImage2D(gl.TEXTURE_2D, 0, format, sizeX, sizeY, 0, format, type, glPixels);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	return texture;
}

/**
 * Creates a WebGLTexture from a given Image
 */
glUtils.createTextureFromImage = function(gl, image, options) {
	var opts = options || {};
	var minFilter = opts.minFilter || opts.filter || gl.LINEAR;
	var magFilter = opts.magFilter || opts.filter || gl.LINEAR;
	var wrap = opts.wrap || gl.REPEAT;
	var format = opts.format || gl.RGBA;
	var type = opts.formatType || gl.UNSIGNED_BYTE;

	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, format, format, type, image);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
	
	gl.bindTexture(gl.TEXTURE_2D, null);
	return texture;
}

glUtils.updateImageTexture = function(gl, texture, image) {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
}

/**
 * Sets a single uniform value in a given shader program.
 */
glUtils.setUniform = function(gl, program, type, name, value) {
	var location = gl.getUniformLocation(program, name);

	switch (type) {
		case 't': 
		case '1i':  gl.uniform1i(location, value ); break;
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
	}
}

/**
 * Sets multiple uniform values for a given shader program
 */
glUtils.setUniforms = function(gl, program, uniforms) {
	for (var uniformName in uniforms) {
		var uniform = uniforms[uniformName];
		glUtils.setUniform(gl, program, uniform.type, uniformName, uniform.value);
	}
}

/**
 * Returns a pixel array at a given size with each pixel set to rgba(0, 0, 0, 255).
 */
glUtils.getEmptyPixelArray = function(sizeX, sizeY) {
	var pixels = [];

	for (var i = 0, l = sizeX * sizeY; i < l; i++) {
		pixels.push(0, 0, 0, 255);
	}

	return pixels;
}