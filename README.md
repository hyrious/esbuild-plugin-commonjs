## @hyrious/esbuild-plugin-commonjs

The [@rollup/plugin-commonjs](https://github.com/rollup/plugins/blob/master/packages/commonjs) as esbuild plugin.

## Usage

<!-- prettier-ignore -->
```js
const { commonjs } = require("@hyrious/esbuild-plugin-commonjs");

require("esbuild").build({
  entryPoints: ["lib.js"],
  bundle: true,
  format: "esm",
  external: ["react"],
  outfile: "out.js",
  plugins: [commonjs()],
}).catch(() => process.exit(1));
```

## Options

```js
commonjs({ filter: /\.c?js$/, cache: true });
```

**filter** (default: `/\.c?js$/`)

A RegExp passed to [`onLoad()`](https://esbuild.github.io/plugins/#on-load) to
match commonjs modules, it is recommended to set a custom filter to skip files
for better performance.

**cache** (default: `true`)

A boolean or RegExp or function to turn on cache for some files that are likely
won't change. When it is `true`, it will be applied to files in `node_modules`.

## what it do

This plugin converts all CommonJS modules to ES modules, so you won't see any
`__require` (expect those dynamic `require`s, esbuild will warn you about them)
when bundling to esm format.

For example, it will convert this code:

```js
var React = require("react");
exports.__esModule = true;
exports.h = React.createElement;
```

To:

```js
import React from "react";
export var h = React.createElement;
```

## License

MIT @ [hyrious](https://github.com/hyrious)
