# express-json-patch-assertion

Assertion framework for JSON patch (RFC-6901) with connect style middleware

## Rationale

* JSON patches are awesome, _but_ not all patches are created equal!
* Allow/deny patches based on conditions
* Doing this procedurally is a PITA

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
      assertion: function (dob, req, res, next) {
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

