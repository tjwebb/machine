/**
 * Run-time type checking. Given a set of typed inputs, ensure the run-time configured
 * inputs are valid.
 */


var _ = require('lodash');
var types = require('./types');

/**
 * Given a tuple value, check it for primatives
 */

var checkTuple = function(type, val) {

  // Check for string
  if(type === 'string') return types.str.is(val);

  // Check for integer
  if(type === 'integer') return types.int.is(val);

  // Check for boolean
  if(type === 'boolean') return types.bool.is(val);

  return false;
};

/**
 * Given a definition and a values object, ensure our types match up/
 */

var rttc = function(def, val) {

  var errors = [];

  var parseObject = function(input, value) {
    _.each(_.keys(input), function(key) {
      var _input = input[key];
      var _value = value[key];

      // If the input is an object continue recursively parsing it
      if(types.obj.is(_input)) {
        parseObject(_input, _value);
        return;
      }

      if(!checkTuple(_input, _value)) {
        throw new Error('Invalid input value');
      }
    });

    // Find the difference in the input and the value and remove any keys that
    // exist on the value but not on the input definition.
    var inputKeys = _.keys(input);
    var valueKeys = _.keys(value);
    var invalidKeys = _.difference(value, input);
    _.each(invalidKeys, function(key) {
      delete value[key];
    });
  };


  // For each input, ensure the type is valid
  _.each(_.keys(def), function(inputName) {
    var input = def[inputName];
    var value = val[inputName];

    // Check if the input is required and missing
    if(input.required && types.undefined.is(value)) {
      errors.push('Missing required input: ' + inputName);
      return;
    }

    // If type if not required and is undefined, return
    if(types.undefined.is(value)) {
      return;
    }

    // If the input is an array, figure out what to do. For now just check that it's an array
    if(input.type === 'array') {
      if(!types.arr.is(value)) {
        errors.push('Invalid type for input: ' + inputName);
        return;
      }
    }

    // If the input is an object, recursively parse it
    if(types.obj.is(input.type)) {

      try {
        parseObject(input.type, value);
        return;
      } catch (err) {
        errors.push('Invalid type for input: ' + inputName);
        return;
      }

    }

    // If the input type isn't an object or array we can just do a simple type check
    if(!checkTuple(input.type, value)) {
      errors.push('Invalid type for input: ' + inputName);
      return;
    }

  });

  if(errors.length) {
    throw new Error(errors);
  }

};

module.exports = rttc;