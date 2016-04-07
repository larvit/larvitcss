[![Build Status](https://travis-ci.org/larvit/larvitcss.svg?branch=master)](https://travis-ci.org/larvit/larvitcss) [![Dependencies](https://david-dm.org/larvit/larvitcss.svg)](https://david-dm.org/larvit/larvitcss.svg)

# larvitcss

Compile, minify, autoprefix etc css from a folder. This module is designed to remove the need to precomile css.

## Installation

```bash
npm i larvitcss;
```

## Usage

In your start script file, make sure all routes to css files are routed to the css-controller.

In the case of larvitbase, do something like this:

```javascript
require('larvitbase')({
	'customRoutes': [{
		"regex": "\\.css$",
		"controllerName": "css"
	}]
});
```