// From https://github.com/jwagner/fluidwebgl/blob/master/src/engine/utils.js

var utils = module.exports = {};

utils.extend = function extend() {
  var target = arguments[0], i, argument, name, f, value;

  for (i = 1; i < arguments.length; i++) {
  	argument = arguments[i];
    for(name in argument) {
      target[name] = argument[name];
    }
  }
  
  return target;
};