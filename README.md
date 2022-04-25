[![Build Status](https://github.com/larvit/larvitcss/actions/workflows/ci.yml/badge.svg)](https://github.com/larvit/larvitcss/actions)


# larvitcss

Compile, minify, autoprefix etc css from a folder. This module is designed to remove the need to precomile css.

Uncompiled files, like .scss, .sass, .less, .stylus etc overrides precompiled .css files with a conflicting name.

The callback is always called, and req.finished is set to true when no file is found.

## Installation

```bash
npm i larvitcss;
```

## Usage

For usage as middleware in for instance Express or larvitbase:

```javascript
const larvitcss = require('larvitcss');
const { Log } = require('larvitutils');
const express = require('express');
const app = express();

app.use(larvitcss({
	log: new Log(), // Optional
	basePath: 'my_path/public', // Optional, defaults to "public/" under current process path,
	notFoundController: (req, res) => { // Optional, controller for file not found, default to setting 404 status code.
		res.statusCode = 404;
		res.end('File not found from special controller');
	},
}));

```

```javascript
const larvitcss = require('larvitcss');
const { Log } = require('larvitutils');
const LBase = require('larvitbase');
const lBase = new LBase({middlewares: [larvitcss()]});

```

## Development mode

Set environment variable LARVITCSS_NO_CACHE to disable cache

# Changelog
## 0.6.0
- Removed larvitfs functionality. basePath is not specified instead and larvitcss is used as a middleware.
