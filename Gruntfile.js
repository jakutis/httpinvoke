var fs = require('fs');

module.exports = function(grunt) {
    var common = fs.readFileSync('./src/common.js').toString();
    var processCommon = function(globalVar) {
        return function(contents) {
            contents = contents.split('var common;');
            return contents[0] + ';' + common + ';common = common(' + globalVar + ');' + contents[1];
        };
    };

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    bail: true
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
            browser: {
                options: {
                    process: processCommon('window')
                },
                src: ['./src/browser.js'],
                dest: './httpinvoke-browser.js'
            },
            node: {
                options: {
                    process: processCommon('global')
                },
                src: ['./src/node.js'],
                dest: './httpinvoke-node.js'
            },
            commonjs: {
                options: {
                    process: function(contents) {
                        var include;

                        include = fs.readFileSync('./httpinvoke-node.js').toString();
                        contents = contents.split('var node;');
                        contents = contents[0] + ';' + include + ';' + contents[1];

                        include = fs.readFileSync('./httpinvoke-browser.js').toString();
                        contents = contents.split('var browser;');
                        contents = contents[0] + ';' + include + ';' + contents[1];

                        return contents;
                    }
                },
                src: ['./src/commonjs.js'],
                dest: './httpinvoke-commonjs.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.registerTask('default', ['concat', 'uglify']);
    grunt.registerTask('test', ['concat', 'mochaTest']);
};
