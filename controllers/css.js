'use strict';

const autoprefixer = require('autoprefixer'),
      compiledCss  = {},
      postcss      = require('postcss'),
      router       = require('larvitrouter')(),
      path         = require('path'),
      sass         = require('node-sass'),
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
	var srcPath,
	    parsed;

	// Serve cached version
	if (compiledCss[req.urlParsed.pathname] !== undefined) {
		log.debug('larvitcss: controllers/css.js: "' + req.urlParsed.pathname + ' found in cache, serving directly!');
		autoprefix(compiledCss[req.urlParsed.pathname], req, res);
		return;
	}

	srcPath = router.fileExists('public' + req.urlParsed.pathname);

	// The original requested file was not found, look for a scss one to compile
	if ( ! srcPath) {
		parsed  = path.parse(req.urlParsed.pathname);
		srcPath = router.fileExists('public' + parsed.dir + '/' + parsed.name + '.scss');
	}

	// No suitable sources found, show 404
	if ( ! srcPath) {
		require(router.fileExists('controllers/404.js')).run(req, res, cb);
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