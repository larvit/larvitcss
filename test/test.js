'use strict';

const request = require('request'),
      assert  = require('assert'),
      log     = require('winston');

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
		request('http://localhost:' + port + '/test/foo.css', function(err, res, body) {
			assert( ! err, 'err must be negative');
			assert.deepEqual(res.statusCode, 200);
			assert.deepEqual(res.headers['content-type'], 'text/css');
			assert.deepEqual(body, 'body{font:100% Helvetica,sans-serif;color:#333}\n');
			done();
		});
	});

	it('Get the source for that SCSS file', function(done) {
		request('http://localhost:' + port + '/test/foo.scss', function(err, res, body) {
			assert( ! err, 'err must be negative');
			assert.deepEqual(res.statusCode, 200);
			assert.deepEqual(res.headers['content-type'], 'text/x-scss; charset=UTF-8');
			assert.deepEqual(body, '$font-stack:    Helvetica, sans-serif;\n$primary-color: #333;\n\nbody {\n  font: 100% $font-stack;\n  color: $primary-color;\n}');
			done();
		});
	});

	it('Get nested SCSS files', function(done) {
		request('http://localhost:' + port + '/test/nested.css', function(err, res, body) {
			assert( ! err, 'err must be negative');
			assert.deepEqual(res.statusCode, 200);
			assert.deepEqual(res.headers['content-type'], 'text/css');
			assert.deepEqual(body, 'a{color:#f00}body{background:#0f0}\n');
			done();
		});
	});
});

describe('Special rules', function() {
	it('Get uncompiled pre-css before compiled css', function(done) {
		request('http://localhost:' + port + '/test/blubb.css', function(err, res, body) {
			assert( ! err, 'err must be negative');
			assert.deepEqual(body, 'a{font-decoration:none}\n');
			done();
		});
	});
});
