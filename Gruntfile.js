var util = require('util');
module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/**/*.js']
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: './<%= pkg.name %>-browser.js',
                dest: './<%= pkg.name %>-browser.min.js'
            }
        },
        concat: {
            dist: {
                options: {
                    process: function(contents, path) {
                        if(path === './httpinvoke-node.js') {
                            return "if(typeof process !== 'undefined' && typeof process.versions !== 'undefined' && typeof process.versions.node !== 'undefined') {" + contents + '} else {';
                        }
                        if(path === './httpinvoke-browser.js') {
                            return contents + '}';
                        }
                        return contents;
                    }
                },
                src: ['./httpinvoke-node.js', './httpinvoke-browser.js'],
                dest: './httpinvoke-generated-commonjs.js'
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.registerTask('install', ['uglify', 'concat']);
    grunt.registerTask('test', ['mochaTest']);
};
