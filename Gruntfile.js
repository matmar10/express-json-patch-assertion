'use strict';

module.exports = function (grunt) {

  const allSrc = [
    'Gruntfile.js',
    'src/**/*.js',
    'test/**/*.js'
  ];

  // load all configured grunt tasks
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    // enforce code quality
    jshint: {
      options: {
        jshintrc: true
      },
      target: allSrc
    },

    // enforce code style guideline
    jsbeautifier: {
      options: {
        config: '.jsbeautifyrc'
      },
      fix: {
        options: {
          mode: 'VERIFY_AND_WRITE'
        },
        src: allSrc
      },
      test: {
        options: {
          mode: 'VERIFY_ONLY'
        },
        src: allSrc
      }
    },

    // make sure json files don't have silly typos
    jsonlint: {
      all: {
        src: [
          '*.json',
          'src/**/*.json',
          'test/**/*.json'
        ]
      }
    },

    // rev version and tag for release
    release: {
      options: {}
    }
  });

  grunt.registerTask('codequality', [
    'jsbeautifier:test',
    'jshint',
    'jsonlint'
  ]);

  grunt.registerTask('test', [
    'webfont',
    'customizeBootstrap',
    'ngconstant',
    'bowerUpdateMain',
    'wiredep',
    'less:all',
    'copy:serve'
  ]);

  grunt.registerTask('test', [
    'exec:install_webdriver_standalone',
    'make',
    'startArchitectApp',
    // TODO: get this working for CI integration
    // 'selenium_phantom_hub',
    'protractor_webdriver',
    'protractor'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'make',
    'useminPrepare',
    'imagemin',
    'svgmin',
    'htmlmin',
    'concat',
    'uglify',
    'copy:dist',
    'filerev',
    'usemin'
  ]);

  grunt.registerTask('serve', [
    'make',
    'connect:serve',
    'open',
    'watch'
  ]);

  grunt.registerTask('default', [
    'codequality',
    'serve'
  ]);

};
