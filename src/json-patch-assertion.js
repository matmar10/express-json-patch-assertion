'use strict';

var Ajv = require('ajv');
var errors = require('common-errors');
var merge = require('merge');

var jsonPatchSchema = require('./schemas/json-patch.json');
var optionsSchema = require('./schemas/options.json');

function JsonPatchAssertion (options) {
  var err, middleware, optionValidator;

  this.options = merge({
    allow: [],
    deny: [],
    property: 'body',
    ajv: {
      allErrors: false
    }
  }, options);

  // validate specified property using JSON schema
  optionValidator = new Ajv({
    allErrors: true
  });

  if (!optionValidator.validate(optionsSchema, this.options)) {
    err = new errors.ValidationError('Invalid configuration options', 'options');
    err.addErrors(optionValidator.errors);
    throw err;
  }

  this.ajv = new Ajv(this.options.ajv);
  this.validatePatch = this.ajv.compile(jsonPatchSchema);

  middleware = function (req, res, next) {

    // validate specified property using JSON schema
    if (!this.validatePatch(req[this.options.property])) {
      err = new errors.ValidationError('Invalid JSON patch', this.options.property);
      err.addErrors(this.validatePatch.errors);
      next(err);
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