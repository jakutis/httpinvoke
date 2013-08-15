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

httpinvoke-generated-browserify-tests.js: test/preindex.js httpinvoke-generated-commonjs.js test/allSpecsRequired.js test/*Spec.js test/postindex.js
	cat test/preindex.js > httpinvoke-generated-browserify-tests.js
	echo ';' >> httpinvoke-generated-browserify-tests.js
	cat ./node_modules/jasmine-reporters/ext/jasmine.js >> httpinvoke-generated-browserify-tests.js
	echo ';' >> httpinvoke-generated-browserify-tests.js
	cat ./node_modules/jasmine-reporters/ext/jasmine-html.js >> httpinvoke-generated-browserify-tests.js
	echo ';' >> httpinvoke-generated-browserify-tests.js
	./node_modules/.bin/browserify test/allSpecsRequired.js >> httpinvoke-generated-browserify-tests.js
	echo ';' >> httpinvoke-generated-browserify-tests.js
	cat test/postindex.js >> httpinvoke-generated-browserify-tests.js

test-browser: httpinvoke-generated-browserify-tests.js
	echo "***** Open http://localhost:3000/test/ *****"
	./node_modules/.bin/serve --no-logs .
