'use strict';

const { Log } = require('larvitutils');
const App = require('larvitbase-www');
const axios = require('axios').default;
const larvitcss = require('../index');
const test = require('tape');

const log = new Log('warning');

axios.defaults.validateStatus = () => true; // Do not throw for any status codes

let app;
let port;

process.cwd('..');

test('Start webserver', async t => {
	require('freeport')(function (err, tmpPort) {
		if (err) throw err;

		port = tmpPort;

		app = new App({
			baseOptions: { httpOptions: tmpPort},
			log: log,
		});
		app.middleware.splice(3, 0, larvitcss({
			log,
			basePath: __dirname + '/../public',
		}));

		app.start(t.end);
	});
});

test('Test a basic, single SCSS file', async t => {
	const res = await axios('http://localhost:' + port + '/test/foo.css');
	t.equal(res.status, 200);
	t.deepEqual(res.headers['content-type'], 'text/css');
	t.deepEqual(res.data, 'body{font:100% Helvetica,sans-serif;color:#333}');
});

test('Get the source for that SCSS file', async t => {
	const res = await axios('http://localhost:' + port + '/test/foo.scss');
	t.deepEqual(res.status, 200);
	t.deepEqual(res.headers['content-type'], 'text/x-scss; charset=UTF-8');
	t.deepEqual(res.data, '$font-stack:    Helvetica, sans-serif;\n$primary-color: #333;\n\nbody {\n  font: 100% $font-stack;\n  color: $primary-color;\n}');
});

test('Get nested SCSS files', async t => {
	const res = await axios('http://localhost:' + port + '/test/nested.css');
	t.deepEqual(res.status, 200);
	t.deepEqual(res.headers['content-type'], 'text/css');
	t.deepEqual(res.data, 'a{color:red}body{background:lime}');
});

test('Get uncompiled pre-css before compiled css', async t => {
	const res = await axios('http://localhost:' + port + '/test/blubb.css');
	t.deepEqual(res.data, 'a{font-decoration:none}');
});

test('Get broken css returns css', async t => {
	const res = await axios('http://localhost:' + port + '/test/broken.css');
	t.deepEqual(res.data, '.test { font;\n');
});

test('Get SCSS with warning', async t => {
	const res = await axios('http://localhost:' + port + '/test/warning.css');
	t.deepEqual(res.status, 200);
	t.deepEqual(res.data, 'a{font-size:1000px}');
});

test('Try to get unavailable css', async t => {
	const res = await axios('http://localhost:' + port + '/test/nope.css');
	t.deepEqual(res.status, 404);
	t.deepEqual(res.data, 'File not found');
});

test('Request the same SCSS file twice, cache should be used (tested by coverage)', async t => {
	await axios('http://localhost:' + port + '/test/foo.css');
	const res = await axios('http://localhost:' + port + '/test/foo.css');
	t.equal(res.status, 200);
	t.deepEqual(res.headers['content-type'], 'text/css');
	t.deepEqual(res.data, 'body{font:100% Helvetica,sans-serif;color:#333}');
});

test('Try to get unavailable css and handle in specific 404-middleware', async t => {
	const orgMiddleware = app.middleware.splice(3, 1, larvitcss({ notFoundController: (req, res, cb) => {
		res.statusCode = 410;
		res.end('Gone!');
		req.finished = true;
		cb();
	}}));

	const res = await axios('http://localhost:' + port + '/test/nope.css');
	t.deepEqual(res.status, 410);
	t.deepEqual(res.data, 'Gone!');

	app.middleware.splice(3, 1, orgMiddleware[0]);
});

test('Stop webserver', async t => {
	app.stop(t.end);
});
