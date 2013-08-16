jasmineRequire.tap = function(j$) {
    j$.TapReporter = jasmineRequire.TapReporter(j$);
};
jasmineRequire.TapReporter = function(j$) {
    var TapReporter = function(options) {
    };
    TapReporter.prototype = {
        _state: 'ready',
        _log: function(text) {
            console.log(text);
        },
        initialize: function() {
        },
        jasmineStarted: function(options) {
            if(this._state !== 'ready') {
                return;
            }
            this._state = 'started';
            this._log('0..' + (options.totalSpecsDefined - 1));
        },
        jasmineDone: function() {
            if(this._state !== 'started') {
                return;
            }
            this._state = 'done';
        },
        suiteStarted: function(result) {
        },
        suiteDone: function(result) {
        },
        specStarted: function(result) {
        },
        specDone: function(result) {
            if(this._state !== 'started') {
                return;
            }
            if(result.status === 'disabled') {
                return;
            }
            var message = '';

            message += result.status === 'passed' ? 'ok' : 'not ok';
            message += ' ' + result.id + ' - ' + result.fullName;

            this._log(message);
        }
    };
    return TapReporter;
};
