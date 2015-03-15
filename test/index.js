mocha.setup('bdd');
function hack() {
    // This is for Opera 10.10 and Mocha combination.
    // Mocha uses Canvas2DContext.measureText, but Opera 10.10 does not have it.
    // It all ends in an uncaught exception and tests not run. Bad. Need to fix.
    if('CanvasRenderingContext2D' in window) {
        if(!CanvasRenderingContext2D.prototype.measureText) {
            CanvasRenderingContext2D.prototype.measureText = function() {
                return 0;
            };
            CanvasRenderingContext2D.prototype.fillText = function() {
            };
        }
    }
}
window.onload = function() {
    hack();
    document.getElementById('agent').appendChild(document.createTextNode(navigator.userAgent));
    mocha.checkLeaks();
    mocha.run();
};
