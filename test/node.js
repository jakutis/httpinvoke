var httpinvoke = require('../httpinvoke-generated-commonjs.js');
httpinvoke('http://updates.html5rocks.com', {
    finished: function(err, result) {
        if(err) {
            return console.log('Failure', err);
        }
        console.log('Success', result);
    }
});
