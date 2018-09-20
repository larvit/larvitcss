'use strict';

const	autoprefixer = require('autoprefixer'),
	compiledCss  = {},
	postcss      = require('postcss'),
	path         = require('path'),
	sass         = require('node-sass'),
	Lfs          = require('larvitfs'),
	lfs          = new Lfs(),
	log          = require('winston');

function serveCss(compiled, req, res) {
	res.setHeader('Last-Modified', compiled.lastModified);
	res.setHeader('Content-Type', 'text/css');
	res.end(compiled.str);
}

function autoprefix(compiled, req, res) {
	postcss([autoprefixer]).process(compiled.str).then(function(result) {
		result.warnings().forEach(function(warn) {
			log.warn('larvitcss: controllers/css.js: autoprefix() - Warning from postcss: ' + warn.toString());
		});
		compiled.str = result.css;
		serveCss(compiled, req, res);
	});
}

exports.run = function(req, res, cb) {
	let srcPath,
	    parsed;

	// Serve cached version
	if (compiledCss[req.urlParsed.pathname] !== undefined && process.env.NODE_ENV !== 'development') {
		log.debug('larvitcss: controllers/css.js: "' + req.urlParsed.pathname + ' found in cache, serving directly!');
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

	log.debug('larvitcss: controllers/css.js: resolved "' + req.urlParsed.pathname + '" to "' + srcPath + '", compile!');

	sass.render({'file': srcPath, 'outputStyle': 'compressed'}, function(err, result) {
		if (err) {
			log.warn('larvitcss: controllers/css.js: Could not render ' + srcPath + ' err: ' + err.message);
			result = {'css': new Buffer([])};
		}

		compiledCss[req.urlParsed.pathname] = {
			'str':          result.css.toString(),
			'lastModified': new Date()
		};
		autoprefix(compiledCss[req.urlParsed.pathname], req, res);
	});
};
