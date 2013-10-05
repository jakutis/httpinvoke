var fs = require('fs');

var replace = function(contents, replacements) {
    replacements.forEach(function(replacement) {
        contents = contents.split(replacement.from);
        contents = contents[0] + ';' + replacement.to + ';' + contents[1];
    });
    return contents;
};

var processCommon = function(globalVar) {
    return function(contents) {
        return replace(contents, [{
            from: 'var pass, isArray, isArrayBufferView, _undefined, nextTick;',
            to: globalVar + ';' + fs.readFileSync('./src/common/static.js').toString()
        }, {
            from: 'var mixInPromise, promise, failWithoutRequest, uploadProgressCb, inputLength, noData, timeout, inputHeaders, statusCb, initDownload, updateDownload, outputHeaders, exposedHeaders, status, outputBinary, input, outputLength, outputConverter;',
            to: fs.readFileSync('./src/common/closures.js').toString()
        }]);
    };
};

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    bail: true
                },
                src: ['test/*.js']
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
                    process: processCommon('global = window;')
                },
                src: ['./src/browser.js'],
                dest: './httpinvoke-browser.js'
            },
            node: {
                options: {
                    process: processCommon('')
                },
                src: ['./src/node.js'],
                dest: './httpinvoke-node.js'
            },
            commonjs: {
                options: {
                    process: function(contents) {
                        return replace(contents, [{
                            from: 'var node;',
                            to: fs.readFileSync('./httpinvoke-node.js').toString()
                        }, {
                            from: 'var browser;',
                            to: fs.readFileSync('./httpinvoke-browser.js').toString()
                        }]);
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
