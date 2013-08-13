var jasmine = require('jasmine-standalone');

// setup global scope
for(var property in jasmine) {
    if(jasmine.hasOwnProperty(property)) {
        window[property] = jasmine[property];
    }
}
require('./tapReporter');

// register specs
require('./allSpecsRequired');

// run jasmine
var currentWindowOnload = window.onload;
window.onload = function() {
    if (currentWindowOnload) {
        currentWindowOnload();
    }
    setTimeout(function() {
        jasmine.jasmine.getEnv().addReporter(new jasmine.jasmine.TapReporter());
        jasmine.jasmine.getEnv().execute();
    }, 0);
};
