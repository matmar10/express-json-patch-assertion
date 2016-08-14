'use strict';

var Ajv = require('ajv');
var merge = require('merge');

var jsonPatchSchema = require('./schemas/json-patch.json');

function JsonPatchAssertion (options) {
  var middleware;

  this.options = merge({
    allow: [],
    deny: [],
    property: 'body',
    ajv: {
      allErrors: false
    }
  }, options);

  this.ajv = new Ajv(this.options.ajv);

  middleware = function (req, res, next) {

    // validate specified property using JSON schema
    if (!this.ajv.validate(jsonPatchSchema, req[this.options.property])) {
      next(this.ajv.errors);
      return;
    }

    // everything was OK
    next();
  }.bind(this);
  middleware.options = this.options;

  return middleware;
}

module.exports = function (options) {
  return new JsonPatchAssertion(options);
};