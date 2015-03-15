/* global window */
window.mocha.setup('bdd');
function hack() {
    'use strict';
    // This is for Opera 10.10 and Mocha combination.
    // Mocha uses Canvas2DContext.measureText, but Opera 10.10 does not have it.
    // It all ends in an uncaught exception and tests not run. Bad. Need to fix.
    if('CanvasRenderingContext2D' in window) {
        if(!window.CanvasRenderingContext2D.prototype.measureText) {
            window.CanvasRenderingContext2D.prototype.measureText = function() {
                return 0;
            };
            window.CanvasRenderingContext2D.prototype.fillText = function() {
            };
        }
    }
}
window.onload = function() {
    'use strict';
    hack();
    window.document.getElementById('agent').appendChild(window.document.createTextNode(window.navigator.userAgent));
    window.mocha.checkLeaks();
    window.mocha.run();
};
