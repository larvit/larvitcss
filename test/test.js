'use strict';

const assert = require('assert'),
      http   = require('http'),
      log    = require('winston');

let port;

// Set up winston
log.remove(log.transports.Console);
log.add(log.transports.Console, {
	'level':     'warn',
	'colorize':  true,
	'timestamp': true,
	'json':      false
});

process.cwd('..');

before(function(done) {
	require('freeport')(function(err, tmpPort) {
		assert( ! err, 'err should be negative');

		port = tmpPort;

		// Start the server up
		require('larvitbase')({
			'port': port,
			'customRoutes': [{
				'regex': '\\.css$',
				'controllerName': 'css'
			}]
		});

		done();
	});
});

describe('Basics', function() {
	it('Test a basic, single SCSS file', function(done) {
		const req = http.request({'port': port, 'path': '/test/foo.css'}, function(res) {
			assert.deepEqual(res.statusCode, 200);
			assert.deepEqual(res.headers['content-type'], 'text/css');
			res.setEncoding('utf8');
			res.on('data', function(chunk) {
				assert.deepEqual(chunk, 'body{font:100% Helvetica,sans-serif;color:#333}\n');
			});
			res.on('end', function() {
				done();
			});
		});

		req.end();
	});

	it('Get the source for that SCSS file', function(done) {
		const req = http.request({'port': port, 'path': '/test/foo.scss'}, function(res) {
			assert.deepEqual(res.statusCode, 200);
			assert.deepEqual(res.headers['content-type'], 'text/x-scss; charset=UTF-8');
			res.setEncoding('utf8');
			res.on('data', function(chunk) {
				assert.deepEqual(chunk, `$font-stack:    Helvetica, sans-serif;
$primary-color: #333;

body {
  font: 100% $font-stack;
  color: $primary-color;
}`);
			});
			res.on('end', function() {
				done();
			});
		});

		req.end();
	});

	it('Get nested SCSS files', function(done) {
		const req = http.request({'port': port, 'path': '/test/nested.css'}, function(res) {
			assert.deepEqual(res.statusCode, 200);
			assert.deepEqual(res.headers['content-type'], 'text/css');
			res.setEncoding('utf8');
			res.on('data', function(chunk) {
				assert.deepEqual(chunk, 'a{color:#f00}body{background:#0f0}\n');
			});
			res.on('end', function() {
				done();
			});
		});

		req.end();
	});

});