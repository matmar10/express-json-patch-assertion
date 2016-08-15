
[![Build Status](https://travis-ci.org/matmar10/express-json-patch-assertion.svg?branch=master)](https://travis-ci.org/matmar10/express-json-patch-assertion)



# express-json-patch-assertion

Assertion framework for JSON patch (RFC-6901) with connect style middleware

## Rationale

* JSON patches are awesome, _but_ not all patches are created equal!
* Allow/deny patches based on conditions
* Doing this procedurally is a PITA

## Logic

* allow - operations **not** explicitly matched here will fail with an error; matched expression will fail if the assertion fails or assertion returns an error
  * if - operation matches provided operation pattern(s)
    * and - condition is true (if it exists)
  * then - run the assertion (if it exists)
    * if - assertion is true
    * then - allow operation to proceed
    * else - block the operation
  * else - allow operation to proceed
* deny - operations matched here will be blocked; non-matched operations are ignored
  * if - operation matches provided operation pattern(s)
    * and - condition is true (if it exists)
  * then - run the assertion (if it exists)
    * if - assertion is true
    * then - allow the operation to proceed
    * else - block the operation
  * else - block the operation

## Example

```
var app = express();
var moment = require('moment');
var patchValidator = require('express-json-patch-assertion');

### Example

app.patch('/user/:id', patchValidator({
  allow: [
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
  deny: [
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

## API

### Option

* **property** _{string}_ [default: `body`] (optional) Request property to retrieve the patch array from
* **allow** _{array|object}_ [default: `[]` ] (optional) Single or list of assertion objects (see: Assertion Object) that should allow the matched operations to proceed; unmatched operations will cause an error
* **deny** _{array|object}_ [default: `[]` ] (optional) Single or list of assertion objects (see: Assertion Object) that should cause the matched operations to be blocked; unmatched operations will be allowed to proceed

### Assertion Object

* **path** _{string|array}_ [default: `*`] (optional) Expression to match against the `path` property of the patch array. _*_ indicates wildcard and will match all paths. Paths like `/addresses/*` are not yet supported (coming soon).
* **op** _{string|array}_ [default: `*`] (optional) Operations or array of operations to match against the `op` property of the patch array; must be one of the valid patch operations: _add_, _replace_, _move_, _copy_, _test_ or _*_ to indicate a wildcard that will match any operation.
* **value** _{mixed|RegExp}_ [default: `*`] (optional) Value to match against the `value` property of the patch. This can be any value, a javascript regular expression, or a wildcard _*_
* **assertion** _{function}_ [default: `false`] (optional) Provide a callback to check if some business logic condition(s) is true. You are provided with the matched operation, the request, and response context as arguments:
	* **operation** _{object}_ The operation that was matched
	* **req** _{object}_ The request object
	* **res** _{object}_ The response object
	* **next** _{function}_ Callback that should be invoked in continuation-passing style with first argument as an error if something went wrong and second argument as a boolean indicating if the condition evaluated to _true_/_false_
		* **err** _{object}_ An error, if one occurred or falsey if OK
		* **result** _{boolean}_ A truthy value indicating if condition was true/false
* **condition** _{function}_ NOT YET IMPLEMENTED - Invoked with request and response context for you to check if some condition is true
	* **req** _{object}_ The request object
	* **res** _{object}_ The response object
	* **next** _{function}_ Callback that should be invoked in continuation-passing style with first argument as an error if something went wrong and second argument as a boolean indicating if the condition evaluated to _true_/_false_
		* **err** _{object}_ An error, if one occurred or falsey if OK
		* **result** _{boolean}_ A truthy value indicating if condition was true/false
* **next** _{boolean}_ [default: `true`] (optional) Whether to continue matching if this assertion was matched. For example, check up front if the user has super admin and stop matching further assertions if so
