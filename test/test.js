'use strict';

const request = require('request');
const lUtils = new (require('larvitutils'))();
const test = require('tape');
const App = require('larvitbase-www');
const log = new lUtils.Log('warning');

let app;
let port;

process.cwd('..');

test('Start webserver', function (t) {
	require('freeport')(function (err, tmpPort) {
		if (err) throw err;

		port = tmpPort;

		app	= new App({
			baseOptions: { httpOptions: tmpPort},
			log: log,
			routerOptions: {
				routes: [{
					regex: '\\.css$',
					controllerPath: 'css.js'
				}]
			}
		});
		app.middleware.splice(3, 0, function (req, res, cb) {
			req.log = log;
			cb();
		});

		app.start(t.end);
	});
});

test('Test a basic, single SCSS file', function (t) {
	request('http://localhost:' + port + '/test/foo.css', function (err, res, body) {
		if (err) throw err;
		t.equal(res.statusCode, 200);
		t.deepEqual(res.headers['content-type'], 'text/css');
		t.deepEqual(body, 'body{font:100% Helvetica,sans-serif;color:#333}');
		t.end();
	});
});

test('Get the source for that SCSS file', function (t) {
	request('http://localhost:' + port + '/test/foo.scss', function (err, res, body) {
		if (err) throw err;
		t.deepEqual(res.statusCode, 200);
		t.deepEqual(res.headers['content-type'], 'text/x-scss; charset=UTF-8');
		t.deepEqual(body, '$font-stack:    Helvetica, sans-serif;\n$primary-color: #333;\n\nbody {\n  font: 100% $font-stack;\n  color: $primary-color;\n}');
		t.end();
	});
});

test('Get nested SCSS files', function (t) {
	request('http://localhost:' + port + '/test/nested.css', function (err, res, body) {
		if (err) throw err;
		t.deepEqual(res.statusCode, 200);
		t.deepEqual(res.headers['content-type'], 'text/css');
		t.deepEqual(body, 'a{color:red}body{background:lime}');
		t.end();
	});
});

test('Get uncompiled pre-css before compiled css', function (t) {
	request('http://localhost:' + port + '/test/blubb.css', function (err, res, body) {
		if (err) throw err;
		t.deepEqual(body, 'a{font-decoration:none}');
		t.end();
	});
});

test('Get broken css returns css', function (t) {
	request('http://localhost:' + port + '/test/broken.css', function (err, res, body) {
		if (err) throw err;
		t.deepEqual(body, '.test { font;\n');
		t.end();
	});
});

test('Stop webserver', function (t) {
	app.stop(t.end);
});
