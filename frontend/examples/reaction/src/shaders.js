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

var shaders = module.exports = {};

/**
 * Vertex shader: Standard
 * Straight 1:1 output.
 */
shaders.standardVert = [
	"attribute vec3 aPos;",
	"attribute vec2 aTexCoord;",
	"varying vec2 uv;",

	"void main() {",
  	"	uv = aTexCoord;",
  	"	gl_Position = vec4(aPos, 1.0);",
	"}"
].join('\n');

/**
 * Fragment Shader: Standard
 * Straight 1:1 output with brightness and contrast adjustment constants.
 */
shaders.standardFrag = [
	"#ifdef GL_ES",
	"precision mediump float;",
	"#endif",

	"varying vec2 uv;",
	"uniform sampler2D tSource;",

	"void main() {",
		" vec4 v = texture2D(tSource, uv);",
		" float s = 0.0;",	// Brightness
		" float q = 3.5;",	// Contrast
		" vec4 c = vec4(v.g * q + s, v.g * q + s, v.g * q + s, 1.0);",
		" c.rgb = c.rgb = (c.rgb - 0.5) / (1.0 - 0.68) + 0.5;",
		"	gl_FragColor = c;",
	"}"
].join('\n');

/**
 * Fragment shader: Reaction
 * Reaction-diffusion implementation. 
 */
shaders.reactionFrag = [
	"#ifdef GL_ES",
	"precision mediump float;",
	"#endif",

	"varying vec2 uv;",
	"uniform float screenWidth;",
	"uniform float screenHeight;",
	"uniform float delta;",
	"uniform float feed;",
	"uniform float kill;",
	"uniform float rateA;",
	"uniform float rateB;",
	"uniform float logoAmount;",
	"uniform float addLogoPre;",
	"uniform float addLogoPost;",
	"uniform float reset;",
	"uniform sampler2D tSource;",
	"uniform sampler2D tBrush;",
	"uniform sampler2D tButtons;",
	"uniform sampler2D tCircles;",

	"void main() {",

		" float step_x = 0.5 / screenWidth;",
		" float step_y = 0.5 / screenHeight;",

		// Calculate the laplacian, which is the difference between the average of nearby cells and 
		// this cell. This is done via a 3x3 convolution using only adjacent neighbors each with a 
		// weight of 0.25
		"	vec2 uvA = texture2D(tSource, uv).rg;",
		"	vec2 uv0 = texture2D(tSource, uv + vec2(-step_x, 0.0)).rg;",
		"	vec2 uv1 = texture2D(tSource, uv + vec2(step_x,  0.0)).rg;",
		"	vec2 uv2 = texture2D(tSource, uv + vec2(0.0, -step_y)).rg;",
		"	vec2 uv3 = texture2D(tSource, uv + vec2(0.0,  step_y)).rg;",
		"	vec2 lapl = uv0 + uv1 + uv2 + uv3 - 4.0 * uvA;",

		"	float logo = texture2D(tBrush, uv).r;",
		" float btns = texture2D(tButtons, uv).r;",
		" float addCircles = texture2D(tCircles, uv).g / 4.0;",

		" float f = feed;",
		" float k = kill;",
		" float ra = rateA * 1.0;",
		" float rb = rateB * 1.0;",

		// Add logo to A and B to integrate it into the pattern.
		" float a = uvA.r + (logo / logoAmount) * addLogoPre;",
		" float b = uvA.g + (logo / logoAmount) * addLogoPre;",
		" float reaction = a * b * b;",

		// Equation explanation: http://www.karlsims.com/rd.html
		"	float du = a + (ra * lapl.r - reaction + f * (1.0 - a)) * delta;",
		"	float dv = b + (rb * lapl.g + reaction - (k + f) * b) * delta;",

		// Add logo to reaction both reaction components
		"	if (logo > 0.0 && addLogoPost > 0.0) {",
		"		dv = logo / 3.0;",
		" 	du = logo / 3.0;",
		" }",

		// Add expanding interaction circles to first reaction component
		" if (addCircles > 0.0) {",
		"		du = du + addCircles / 4.0;",
		" }",

		" if (btns > 0.0) {",
		"   dv = btns / 2.0;",
		" }",

		" gl_FragColor = vec4(du, dv, 0.0, 1.0);",
	"}"
].join('\n');