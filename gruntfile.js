/* global module */
"use strict";

module.exports = function (grunt) {
  require("load-grunt-tasks")(grunt);

  grunt.initConfig({
    babel: {
      options: {
        sourceMap: false,
        presets: ['es2015']
      },
      dist: {
        files: {
          'dist/substituteteacher.js': 'src/substituteteacher.js'
        }
      }
    },
    jasmine: {
      pivotal: {
        src: "dist/substituteteacher.js",
        options: {
          specs: "test/*Spec.js",
          helpers: "test/*Helper.js"
        }
      }
    },
    uglify: {
      my_target: {
        files: {
          "dist/substituteteacher.min.js": ["dist/substituteteacher.js"]
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-jasmine");
  grunt.loadNpmTasks("grunt-contrib-uglify");

  grunt.registerTask("default", ["babel", "uglify"]);
};