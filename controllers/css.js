'use strict';

const autoprefixer = require('autoprefixer');
const compiledCss = {};
const postcss = require('postcss');
const path = require('path');
const sass = require('sass');
const Lfs = require('larvitfs');
const lfs = new Lfs();
const fs = require('fs');

function serveCss(compiled, req, res) {
	res.setHeader('Last-Modified', compiled.lastModified);
	res.setHeader('Content-Type', 'text/css');
	res.end(compiled.str);
}

function autoprefix(compiled, req, res) {
	postcss([autoprefixer]).process(compiled.str, { from: undefined })
		.then(function (result) {
			result.warnings().forEach(function (warn) {
				req.log.warn('larvitcss: controllers/css.js: autoprefix() - Warning from postcss: ' + warn.toString());
			});
			compiled.str = result.css;
			serveCss(compiled, req, res);
		})
		.catch(function (err) {
			if (err.name === 'CssSyntaxError') {
				req.log.warn('larvitcss: controllers/css.js: autoprefix() - CSS syntax error, serving original file: ' + err);

				return serveCss(compiled, req, res);
			}

			throw err;
		});
}

module.exports = function (req, res, cb) {
	let srcPath;
	let parsed;

	// Serve cached version
	if (compiledCss[req.urlParsed.pathname] !== undefined && process.env.NODE_ENV !== 'development') {
		req.log.debug('larvitcss: controllers/css.js: "' + req.urlParsed.pathname + ' found in cache, serving directly!');
		autoprefix(compiledCss[req.urlParsed.pathname], req, res);

		return;
	}

	parsed = path.parse(req.urlParsed.pathname);

	// Check for scss first
	srcPath = lfs.getPathSync('public' + parsed.dir + '/' + parsed.name + '.scss');

	// If scss does not exist, check if pre compiled css exists
	if (srcPath === false) {
		srcPath = lfs.getPathSync('public' + req.urlParsed.pathname);
	}

	// No suitable sources found, show 404
	if (srcPath === false) {
		let notFoundPath = lfs.getPathSync('controllers/404.js');

		if (notFoundPath) {
			require(notFoundPath).run(req, res, cb);
		} else {
			res.statusCode = 404;
			res.end('File not found');
		}

		return;
	}

	req.log.debug('larvitcss: controllers/css.js: resolved "' + req.urlParsed.pathname + '" to "' + srcPath + '", compile!');

	sass.render({file: srcPath, outputStyle: 'compressed'}, function (err, result) {
		if (err) {
			req.log.warn('larvitcss: controllers/css.js: Could not render ' + srcPath + ' err: ' + err.message);
			result = {css: fs.readFileSync(srcPath)};
		}

		compiledCss[req.urlParsed.pathname] = {
			str: result.css.toString(),
			lastModified: new Date()
		};
		autoprefix(compiledCss[req.urlParsed.pathname], req, res);
	});
};
