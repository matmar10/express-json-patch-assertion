'use strict';

var Ajv = require('ajv');
var BBPromise = require('bluebird');
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

    this.applyAssertions(this.options.allow, req, res)
      .then(function (unmatched) {
        if (unmatched.length) {
          // whitelist should fail unmatched
          // return this.failUnmatchedAssertions(unmatched, req, res);
        }
      }.bind(this))
      .then(function () {
        return this.applyAssertions(this.options.deny, req, res);
      }.bind(this))
      .then(function () {
        // everything was OK
        next();
      }, next);

  }.bind(this);
  middleware.options = this.options;

  return middleware;
}

JsonPatchAssertion.prototype.applyAssertions = function (assertions, req, res) {

  var i, j, matchedOperation,
    pending = [],
    // create a shallow copy for ensuring all operations matched an assertion
    operations = req[this.options.property].slice();

  // check operations against whitelist; FAIL if any DO NOT MATCH
  i = 0;

  while (operations.length && i < operations.length) {

    matchedOperation = false;

    loopOverWhitelist:
    for (j = 0; j < assertions.length; j++) {
      if (this.operationMatches(operations[i], assertions[j])) {
        matchedOperation = operations[i];
        // this one is matched
        operations.splice(i, 1);
        pending.push(this.assertOperation(matchedOperation, assertions[j], req, res));
        break loopOverWhitelist;
      }
    }

    // if item WAS NOT matched, need to increment
    // if item WAS matched we shifted to the left, so no need to increment
    if (!matchedOperation) {
      i++;
    }
  }

  // return unmatched operations
  return BBPromise.all(pending)
    .then(function () {
      return operations;
    });
};

JsonPatchAssertion.prototype.operationMatches = function (operation, assertion) {

  function matchProperty (propertyValue, assertionValue) {
    var matches = false;

    // match path
    if ('*' === assertionValue) {
      return true;
    }

    switch (true) {

      case (assertionValue instanceof RegExp):
        return assertionValue.matches(propertyValue);

      case ('string' === typeof assertionValue):
        /* falls through  */
      case ('number' === typeof assertionValue):
        /* falls through  */
      default:
        return assertionValue === propertyValue;
    }

    return matches;
  }

  function matchAssertion (propertyName) {
    var i;
    // null case - it's not defined
    if (undefined === assertion[propertyName]) {
      return true;
    }
    // 1 case - it's a scalar value
    if (!Array.isArray(assertion[propertyName])) {
      return matchProperty(operation[propertyName], assertion[propertyName]);
    }
    // {n} case - it's an array
    for (i = 0; i < operation[propertyName]; i++) {
      if (matchProperty(operation[propertyName], assertion[propertyName][i])) {
        return true;
      }
    }
    return false;
  }

  return matchAssertion('path') && matchAssertion('op') && matchAssertion('value');
};

JsonPatchAssertion.prototype.assertOperation = function (operation, assertion, req, res) {

  return new BBPromise(function (resolve, reject) {

    if ('function' !== typeof assertion.assertion) {
      reject(new errors.ArgumentError('assertion'));
      return;
    }

    assertion.assertion(operation, req, res, function (err, result) {

      // the assertion encountered an error
      if (err) {
        reject(err);
        return;
      }

      // the assertion evaluated to false
      if (!result) {
        err = new errors.ValidationError('Assertion failed', assertion.path);
        err.assertion = assertion;
        err.operation = operation;
        reject(err);
        return;
      }

      // the assertion evaluated to true 
      resolve();
    });
  });
};

module.exports = function (options) {
  return new JsonPatchAssertion(options);
};