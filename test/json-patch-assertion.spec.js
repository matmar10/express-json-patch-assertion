'use strict';

/* jshint -W024 */
/* jshint expr:true */

var expect = require('chai').expect;

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

  describe('patch validation', function () {

    describe('`property` option default', function () {
      it('accepts a valid patch', function (done) {
        jsonPatchAssertion({
          property: 'userEdits'
        })({
          userEdits: [
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
          expect(err).to.be.an.instanceof(Array);
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
            { op: 'remove', path: '/jobs/0' },
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
          expect(err).to.be.an.instanceof(Array);
          done();
        });
      });
    });

  });


});