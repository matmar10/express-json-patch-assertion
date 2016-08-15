
[![Build Status](https://travis-ci.org/matmar10/express-json-patch-assertion.svg?branch=master)](https://travis-ci.org/matmar10/express-json-patch-assertion)



# express-json-patch-assertion

Assertion framework for JSON patch (RFC-6901) with connect style middleware

## Rationale

* JSON patches are awesome, _but_ not all patches are created equal!
* Allow/deny patches based on conditions
* Doing this procedurally is a PITA

## Logic

* if - operation matches provided operation pattern(s)
  * and - condition is true (if it exists)
* then - run the assertion (if it exists)
  * if - assertion is true
  * then - allow operation to proceed
  * else - block the operation
* else - allow operation to proceed

* whitelist - any operations **not** explicitly matched here will fail with an error
* blacklist - any operations matched here will fail with an error; non-matched operations are ignored

## Example

```
var app = express();
var moment = require('moment');
var patchValidator = require('express-json-patch-assertion');

### Example

app.patch('/user/:id', patchValidator({
  whitelist: [
    {
      condition: function (req, res, next) {
        return req.user.isAdmin;
      },
      path: '*',
      op: '*',
      next: false
    },
    {
      path: [ 'firstName', 'lastName', 'age' ]
      op: [ 'add' ]
    },
    {
      path: '/favoriteFood',
      op: '*'
    },
    {
      path: '/dob',
      op: [ 'add', 'replace' ],
      assertion: function (operation, req, res, next) {
        if (moment(dob).isBefore(dobOfOldestPersonInWorld, 'day')) {
          next(new Error('You are unrealistically old!'));
        }
        next(null, true);
      }
    }
  ],
  blacklist: [
    {
      condition: function (req, res, next) {
        if (!req.user) {
          next(new Error('Something wrong: no user present!'));
          return;
        }
        next(null, !req.user.isAdmin);
      },
      path: '/payoutSettings',
      op: '*'
    }
  ]
}), function (req, res) {
  res.status(204).send();
});

```

## Usage

### Assertion Object

* **condition** _{function}_ Invoked with request and response context for you to check if some condition is true
	* **req** _{object}_ The request object
	* **res** _{object}_ The response object
	* **next** _{function}_ Method that should be invoked in continuation-passing style with first argument as an error if something went wrong and second argument as a boolean indicating if the condition evaluated to _true_/_false_
		* **err** _{object}_ An error, if one occurred or falsey if OK
		* **result** _{boolean}_ A truthy value indicating if condition was true/false

