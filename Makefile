all:
	echo "if(typeof process !== 'undefined' && typeof process.versions !== 'undefined' && typeof process.versions.node !== 'undefined') {" > httpinvoke-generated-commonjs.js
	cat httpinvoke-node.js >> httpinvoke-generated-commonjs.js
	echo '} else {' >> httpinvoke-generated-commonjs.js
	cat httpinvoke-browser.js >> httpinvoke-generated-commonjs.js
	echo '}' >> httpinvoke-generated-commonjs.js
