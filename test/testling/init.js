// Jasmine boot.js for browser runners - exposes external/global interface, builds the Jasmine environment and executes it.
(function() {
  window.jasmine = jasmineRequire.core(jasmineRequire);
  jasmineRequire.tap(jasmine);

  var env = jasmine.getEnv();

  var jasmineInterface = {
    describe: function(description, specDefinitions) {
      return env.describe(description, specDefinitions);
    },

    xdescribe: function(description, specDefinitions) {
      return env.xdescribe(description, specDefinitions);
    },

    it: function(desc, func) {
      return env.it(desc, func);
    },

    xit: function(desc, func) {
      return env.xit(desc, func);
    },

    beforeEach: function(beforeEachFunction) {
      return env.beforeEach(beforeEachFunction);
    },

    afterEach: function(afterEachFunction) {
      return env.afterEach(afterEachFunction);
    },

    expect: function(actual) {
      return env.expect(actual);
    },

    pending: function() {
      return env.pending();
    },

    addMatchers: function(matchers) {
      return env.addMatchers(matchers);
    },

    spyOn: function(obj, methodName) {
      return env.spyOn(obj, methodName);
    },

    clock: env.clock,
    setTimeout: env.clock.setTimeout,
    clearTimeout: env.clock.clearTimeout,
    setInterval: env.clock.setInterval,
    clearInterval: env.clock.clearInterval,
    jsApiReporter: new jasmine.JsApiReporter({
      timer: new jasmine.Timer()
    })
  };

  if (typeof window == "undefined" && typeof exports == "object") {
    extend(exports, jasmineInterface);
  } else {
    extend(window, jasmineInterface);
  }

  env.catchExceptions(true);

  var tapReporter = new jasmine.TapReporter({
    env: env,
    timer: new jasmine.Timer()
  });

  env.addReporter(jasmineInterface.jsApiReporter);
  env.addReporter(tapReporter);

  window.jasmineExecute = function() {
    tapReporter.initialize();
    env.execute();
  };
  function extend(destination, source) {
    for (var property in source) destination[property] = source[property];
    return destination;
  }

}());
