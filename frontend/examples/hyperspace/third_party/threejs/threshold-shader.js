var THREE = require('three');

/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Full-screen textured quad shader
 */

THREE.ThresholdShader = {

  uniforms: {

    "tDiffuse": { type: "t", value: null },
    "opacity":  { type: "f", value: 1.0 }

  },

  vertexShader: [

    "varying vec2 vUv;",

    "void main() {",

      "vUv = uv;",
      "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

    "}"

  ].join("\n"),

  fragmentShader: [

    "uniform float opacity;",

    "uniform sampler2D tDiffuse;",

    "varying vec2 vUv;",

    "void main() {",

      "vec4 texel = texture2D( tDiffuse, vUv );",
      "float avg = (texel.r + texel.g + texel.b) / 3.0;",
      "if (avg > 0.7) {",
      "  gl_FragColor = vec4(1.0);",
      "} else {",
      "  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);",
      "}",
    "}"

  ].join("\n")

};