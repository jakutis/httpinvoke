.PHONY: compile test-node test test-browser

# TODO minification
compile: httpinvoke-generated-commonjs.js

httpinvoke-generated-commonjs.js: httpinvoke-node.js httpinvoke-browser.js
	echo "if(typeof process !== 'undefined' && typeof process.versions !== 'undefined' && typeof process.versions.node !== 'undefined') {" > httpinvoke-generated-commonjs.js
	cat httpinvoke-node.js >> httpinvoke-generated-commonjs.js
	echo '} else {' >> httpinvoke-generated-commonjs.js
	cat httpinvoke-browser.js >> httpinvoke-generated-commonjs.js
	echo '}' >> httpinvoke-generated-commonjs.js

.ONESHELL:
test-node:
	node ./dummyserver.js &
	DPID=$$!
	./node_modules/.bin/mocha --watch
	kill $$DPID

.ONESHELL:
test:
	node ./dummyserver.js &
	DPID=$$!
	./node_modules/.bin/mocha
	kill $$DPID

.ONESHELL:
test-browser:
	node ./dummyserver.js &
	DPID=$$!
	./node_modules/.bin/karma start
	kill $$DPID
