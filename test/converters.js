var cfg = require('../dummyserver-config');
var httpinvoke = require('../httpinvoke-node');

describe('"converters" option', function() {
    'use strict';
    this.timeout(10000);
    it('basically works', function(done) {
        httpinvoke(cfg.url + 'boolean', 'POST', {
            input: true,
            inputType: 'boolean',
            outputType: 'boolean',
            converters: {
                'text boolean': Boolean,
                'boolean text': String
            },
            finished: function(err, output) {
                if(err) {
                    return done(err);
                }
                if(output !== true) {
                    return done(new Error('Expected output to be converted to a boolean value "true"'));
                }
                done();
            }
        });
    });
});
