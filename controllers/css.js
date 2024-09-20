'use strict';

const autoprefixer = require('autoprefixer');
const { Log } = require('larvitutils');
const compiledCss = {};
const postcss = require('postcss');
const path = require('path');
const sass = require('sass');
const fs = require('fs');

function serveCss(compiled, req, res) {
	res.setHeader('Last-Modified', compiled.lastModified);
	res.setHeader('Content-Type', 'text/css');
	res.end(compiled.str);

	req.finished = true;
}

module.exports = options => {
	const log = options.log || new Log();
	const basePath = options.basePath || path.join(process.cwd(), '/public');
	const notFoundController = options.notFoundController;

	return async (req, res, cb) => {
		if (!RegExp('\\.css$').test(req.urlParsed.pathname)) return cb();

		// Serve cached version
		if (compiledCss[req.urlParsed.pathname] !== undefined && !process.env.LARVITCSS_NO_CACHE) {
			log.debug('larvitcss: controllers/css.js: "' + req.urlParsed.pathname + ' found in cache, serving directly!');

			serveCss(compiledCss[req.urlParsed.pathname], req, res);

			return cb();
		}

		const parsed = path.parse(req.urlParsed.pathname);

		// Check for scss first
		let srcPath = path.join(basePath, parsed.dir, `${parsed.name}.scss`);

		// If scss does not exist, check if pre compiled css exists
		if (!fs.existsSync(srcPath)) {
			srcPath = path.join(basePath, req.urlParsed.pathname);
		}

		// No suitable sources found, show 404
		if (!fs.existsSync(srcPath)) {
			if (notFoundController) {
				return notFoundController(req, res, cb);
			} else {
				res.statusCode = 404;
				req.finished = true;
				res.end('File not found');

				return cb();
			}
		}

		log.debug('larvitcss: controllers/css.js: resolved "' + req.urlParsed.pathname + '" to "' + srcPath + '", compile!');

		let result;
		try {
			result = sass.compile(srcPath, {style: 'compressed'});
		} catch (err) {
			log.warn('larvitcss: controllers/css.js: Could not render ' + srcPath + ' err: ' + err.message);
			result = {css: fs.readFileSync(srcPath)};
		}

		compiledCss[req.urlParsed.pathname] = {
			str: result.css.toString(),
			lastModified: new Date(),
		};

		try {
			const result = await postcss([autoprefixer]).process(compiledCss[req.urlParsed.pathname].str, { from: undefined });
			result.warnings().forEach(function (warn) {
				log.warn('larvitcss: controllers/css.js: autoprefix() - Warning from postcss: ' + warn.toString());
			});
			compiledCss[req.urlParsed.pathname].str = result.css;
		} catch (err) {
			if (err.name === 'CssSyntaxError') {
				log.warn('larvitcss: controllers/css.js: autoprefix() - CSS syntax error, serving original file: ' + err);
			}
		}

		serveCss(compiledCss[req.urlParsed.pathname], req, res);

		cb();
	};
};
