.PHONY: compile test

compile: httpinvoke-generated-commonjs.js

httpinvoke-generated-commonjs.js: httpinvoke-node.js httpinvoke-browser.js
	echo "if(typeof process !== 'undefined' && typeof process.versions !== 'undefined' && typeof process.versions.node !== 'undefined') {" > httpinvoke-generated-commonjs.js
	cat httpinvoke-node.js >> httpinvoke-generated-commonjs.js
	echo '} else {' >> httpinvoke-generated-commonjs.js
	cat httpinvoke-browser.js >> httpinvoke-generated-commonjs.js
	echo '}' >> httpinvoke-generated-commonjs.js

test-node:
	./node_modules/.bin/jasmine-node --verbose test

httpinvoke-generated-browserify-tests.js: httpinvoke-generated-commonjs.js test/allSpecsRequired.js test/*Spec.js
	./node_modules/.bin/browserify test/allSpecsRequired.js -o httpinvoke-generated-browserify-tests.js

test-browser: httpinvoke-generated-browserify-tests.js
	echo "Open http://localhost:3000/test/"
	./node_modules/.bin/serve --no-logs .
