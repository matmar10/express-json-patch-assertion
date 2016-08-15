'use strict';

/* jshint -W024 */
/* jshint expr:true */

var expect = require('chai').expect;
var errors = require('common-errors');

describe('jsonPatchAssertion', function() {

  var jsonPatchAssertion = require('./../');

  describe('top level api', function () {
    it('is a function', function () {
      expect(jsonPatchAssertion).to.be.a('function');
    });
  });

  describe('initialization', function () {

    it('is a function', function () {
      expect(jsonPatchAssertion).to.be.a('function');
    });

    it('generates a middleware with default options', function () {
      var middleware = jsonPatchAssertion();
      expect(middleware).to.be.a('function');
      expect(middleware.options).to.be.a('object');
      expect(middleware.options.allow).to.be.a('array');
      expect(middleware.options.deny).to.be.a('array');
    });

    it('generates a middleware with options', function () {
      var options = {
        allow: [
          {
            path: '*',
            op: '*'
          }
        ],
        deny: [
          {
            path: '/id',
            op: '*'
          }
        ]
      };
      var middleware = jsonPatchAssertion(options);
      expect(middleware).to.be.a('function');
      expect(middleware.options).to.be.a('object');
      expect(middleware.options.allow).to.deep.equal(options.allow);
      expect(middleware.options.deny).to.deep.equal(options.deny);
    });
  });

  describe('options validation', function () {

    describe('validates `property`', function () {
      it('rejects invalid `property` option', function () {
        expect(function () {
          jsonPatchAssertion({
            property: false
          });
        }).to.throw(errors.ValidationError);
        expect(function () {
          jsonPatchAssertion({
            property: 1
          });
        }).to.throw(errors.ValidationError);
        expect(function () {
          jsonPatchAssertion({
            property: 'user'
          });
        }).to.not.throw(errors.ValidationError);
      });
    });
  });

  describe('patch schema validation', function () {

    describe('`property` option default', function () {
      it('accepts a valid patch', function (done) {
        jsonPatchAssertion()({
          body: [
            { op: 'replace', path: '/names/first', value: 'Matthew' },
            { op: 'add', path: '/names/middle', value: 'Joseph' },
            { op: 'add', path: '/names/last', value: 'Martin' },
            { op: 'remove', path: '/jobs/0' },
          ]
        }, {}, function (err) {
          expect(err).to.be.undefined;
          done();
        });
      });
      it('rejects invalid patches', function (done) {
        jsonPatchAssertion()({
          body: [
            { 'foo': 'bar', 'a': false }
          ]
        }, {}, function (err) {
          expect(err).to.be.an.instanceof(errors.ValidationError);
          done();
        });
      });
    });

    describe('`property` option', function () {

      it('accepts a valid patch', function (done) {
        jsonPatchAssertion({
          property: 'userEdits'
        })({
          userEdits: [
            { op: 'replace', path: '/names/first', value: 'Matthew' },
            { op: 'add', path: '/names/middle', value: 'Joseph' },
            { op: 'add', path: '/names/last', value: 'Martin' },
            { op: 'remove', path: '/jobs/0' }
          ]
        }, {}, function (err) {
          expect(err).to.be.undefined;
          done();
        });
      });

      it('rejects invalid patches', function (done) {
        jsonPatchAssertion({
          property: 'userEdits'
        })({
          userEdits: {}
        }, {}, function (err) {
          expect(err).to.be.an.instanceof(errors.ValidationError);
          done();
        });
      });
    });

  });


  describe('whitelist', function () {
    it('runs provided assertion on matched operations', function (done) {

      var assertions = [
        {
          // this should fail
          op: 'add', path: '/names/last', assertion: function (operation, req, res, next) {
            next(null, operation.value === 'Smith');
          }
        },
        {
          // this should pass
          op: 'add', path: '/names/middle', assertion: function (operation, req, res, next) {
            next(null, operation.value === 'Joseph');
          }
        }
      ];

      var operations = [
        { op: 'add', path: '/names/middle', value: 'Joseph' },
        { op: 'add', path: '/names/last', value: 'Martin' }
      ];

      jsonPatchAssertion({
        allow: assertions
      })({
        body: operations
      }, {}, function (err) {
        expect(err).to.be.an.instanceof(errors.ValidationError);
        expect(err.operation).to.equal(operations[1]);
        expect(err.assertion).to.equal(assertions[0]);
        done();
      });

    });
  });
});