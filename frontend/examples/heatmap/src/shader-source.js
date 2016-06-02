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

// Based on http://http.developer.nvidia.com/GPUGems/gpugems_ch38.html
// Equation numbers refer to the numbered equations in that chapter

var shaders = module.exports = {};

// Functions for getting one- and two-dimensional cardinal neighbors, used by multiple shaders.
var includes = [
	"#ifdef GL_ES",
	"precision highp float;",
	"#endif",

	"uniform vec2 px;",
	"varying vec2 uv;",

	"void v1texRectNeighbors(sampler2D tex, out float x0, out float x1, out float y0, out float y1) {",
		"	x0 = texture2D(tex, uv - vec2(px.x, 0)).r;",
		"	x1 = texture2D(tex, uv + vec2(px.x, 0)).r;",
		"	y0 = texture2D(tex, uv - vec2(0, px.y)).r;",
		"	y1 = texture2D(tex, uv + vec2(0, px.y)).r;",
	"}",

	"void v2texRectNeighbors(sampler2D tex, out float x0, out float x1, out float y0, out float y1) {",
		" x0 = texture2D(tex, uv - vec2(px.x, 0)).x;",
		" x1 = texture2D(tex, uv + vec2(px.x, 0)).x;",
		" y0 = texture2D(tex, uv - vec2(0, px.y)).y;",
		" y1 = texture2D(tex, uv + vec2(0, px.y)).y;",
	"}"
];

/**
 * Vertex Shader - Kernel
 * Maps texture coordinates to vertex position coordinates
 */
shaders.kernelVert = [
	"#ifdef GL_ES",
	"precision highp float;",
	"#endif",

	"attribute vec3 position;",
	"uniform vec2 px;",
	"varying vec2 uv;",

	"void main() {",
		"	uv = position.xy * 0.5 + 0.5;",
		"	gl_Position = vec4(position, 1.0);",
	"}"
].join('\n');

/**
 * Fragment Shader - Copy
 * Outputs a given source texture
 */
shaders.copyFrag = [
	"#ifdef GL_ES",
	"precision highp float;",
	"#endif",
	
	"uniform sampler2D source;",
	"varying vec2 uv;",

	"void main() {",
		"	gl_FragColor = texture2D(source, uv);",
	"}"
].join('\n');

shaders.cursorTempFrag = [
	"#ifdef GL_ES",
	"precision highp float;",
	"#endif",
	
	"uniform sampler2D density;",
	"uniform sampler2D cursor;",
	"varying vec2 uv;",

	"void main() {",
		" vec3 a = texture2D(density, uv).rgb;",
		" vec3 b = texture2D(cursor, uv).rgb;",
		" vec3 c = a + b;",
		" float avg = (a.r + a.g) / 2.0;",

		" if (avg >= 0.9) {",
		" 	c = a - (b / 2.0);",
		" }",

		"	gl_FragColor = vec4(c, 1.0);",
	"}"
].join('\n');

/**
 * Fragment Shader - Advect
 * Advection is the process where the velocity of a fluid transports that fluid and any other
 * quantities associated with that fluid (density, temperature). This shader performs the advection 
 * of a source field by a velocity field. The (x, y) coordinates in the velocity field are stored 
 * in the red and green channels of the velocity texture.
 *
 * Equation 13
 */
shaders.advectFrag = [
	"#ifdef GL_ES",
	"precision highp float;",
	"#endif",

	"uniform sampler2D source;",
	"uniform sampler2D velocity;",
	"uniform float dt;",
	"uniform float scale;",
	"uniform vec2 px;",
	"varying vec2 uv;",

	"void main() {",
		"	gl_FragColor = texture2D(source, uv - texture2D(velocity, uv).xy * dt * px) * scale;",
	"}"
].join('\n');


/**
 * Fragment Shader - Divergence
 * Computes the divergence of the velocity vector field. Divergence represents the quantity 
 * of "stuff" flowing in and out of a grid-square of fluid.
 */
shaders.divergenceFrag = includes.concat(
	"uniform sampler2D velocity;",
	"uniform float dt;",

	"void main() {",
		" float x0, x1, y0, y1;",
		"	v2texRectNeighbors(velocity, x0, x1, y0, y1);",
		"	float divergence = (x1 - x0 + y1 - y0) * 0.5;",
		"	gl_FragColor = vec4(divergence);",
	"}"
).join('\n');

/**
 * Fragment Shader - Jacobi
 * See Equation 15
 */
shaders.jacobiFrag = includes.concat(
	"uniform sampler2D pressure;",
	"uniform sampler2D divergence;",
	"uniform float alpha;",
	"uniform float beta;",

	"void main() {",
    "	float x0, x1, y0, y1;",
    "	v1texRectNeighbors(pressure, x0, x1, y0, y1);",
    "	float d = texture2D(divergence, uv).r;",
    "	float relaxed = (x0 + x1 + y0 + y1 + alpha * d) * beta;",
    "	gl_FragColor = vec4(relaxed);",
	"}"
).join('\n');

/**
 * Fragment Shader - Pressure
 *
 */
shaders.pressureFrag = includes.concat(
	"uniform sampler2D pressure;",
	"uniform sampler2D velocity;",
	"uniform float alpha;",
	"uniform float beta;",
	"uniform float scale;",

	"void main() {",
    "	float x0, x1, y0, y1;",
    "	v1texRectNeighbors(pressure, x0, x1, y0, y1);",
    "	vec2 v = texture2D(velocity, uv).xy;",
    "	gl_FragColor = vec4((v - (vec2(x1, y1) - vec2(x0, y0)) * 0.5) * scale, 1.0, 1.0);",
	"}"
).join('\n');

/**
 * Fragment Shader - Temperature
 * 
 */
shaders.temperatureFrag = [
	"#ifdef GL_ES",
	"precision highp float;",
	"#endif",

	"uniform sampler2D density;",
	"uniform sampler2D typeImage;",
	"uniform float scale;",
	"uniform float mass;",
	"varying vec2 uv;",

	"const vec2 up = vec2(0.0, 1.0);",

	"void main() {",
		" vec2 uv1 = vec2(uv.x, (uv.y - 1.0) * -1.0);",
		" float t = -texture2D(typeImage, uv1).r;",
		" float d = texture2D(density, uv).r;",
		" gl_FragColor = vec4((mass * d + scale * t) * up, 0.0, 1.0);",
	"}"	
].join('\n');


shaders.vorticityFrag = includes.concat(
	"uniform sampler2D velocity;",

	"void main() {",
		"	float x0, x1, y0, y1;",
		"	v2texRectNeighbors(velocity, x0, x1, y0, y1);",
		"	float vorticity = ((x1 - x0) - (y1 - y0)) * 0.5;",
		"	gl_FragColor = vec4(vorticity);",
	"}"
).join('\n');


shaders.vorticityForceFrag = includes.concat(
	"uniform sampler2D vorticity;",
	"uniform sampler2D velocity;",
	"uniform vec2 dx;",
	"uniform float dt;",

	"void main() {",
		"	float x0, x1, y0, y1;",
		"	v1texRectNeighbors(vorticity, x0, x1, y0, y1);",

		"	float c = texture2D(vorticity, uv).r;",
		
		"	vec2 force = vec2(abs(y1) - abs(y0), abs(x1) - abs(x0)) * 0.5;",
		"	float magSqr = max(2.4414e-4, dot(force, force));",
		"	force = force * inversesqrt(magSqr);",
		"	force = force * dx * c * vec2(1.0, -1.0);",

		"	vec2 v = texture2D(velocity, uv).xy + dt * force;",
		"	gl_FragColor = vec4(v, 0.0, 1.0);",
	"}"
).join('\n');

/**
 * Fragment Shader - Visualize
 * Maps the fluid temperature grid to a color gradient
 */
shaders.visualizeFrag = [
	"#ifdef GL_ES",
	"precision highp float;",
	"#endif",

	"uniform sampler2D source;",
	"uniform sampler2D typeImage;",
	"uniform sampler2D colorLookup;",
	"uniform float typeAmount;",
	"uniform vec2 px;",
	"varying vec2 uv;",
	
	"void main() {",
		" vec2 uv1 = vec2(uv.x, (uv.y - 1.0) * -1.0);",
		" float t = texture2D(typeImage, uv1).r * typeAmount;",
		" float d = texture2D(source, uv).r - t;",
		" float c = clamp(d / 1.8, 0.0, 1.0);",
		" gl_FragColor = texture2D(colorLookup, vec2(c, 0.0));",
	"}"
].join('\n');