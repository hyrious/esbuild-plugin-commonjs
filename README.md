# @hyrious/esbuild-plugin-commonjs

An esbuild plugin to help you bundle commonjs external modules.

This plugin is used to address [evanw/esbuild#1467][1], where you want to
bundle some commonjs external modules in es modules context. But accidentally
you see a `__require` in your code prints error at runtime and forbids
other bundlers from analyzing the dependencies. For example:

```js
// some commonjs library, like react-dom
var React = require('react')

// your esm code
export { render } from 'react-dom'

// after esbuild --bundle
var React = __require('react') // <- you dislike this
// ...
export { render }

// with this plugin
import __import_react from 'react' // <- you want this
var React = __import_react
// ...
export { render }
```

This plugin was inspired by [a comment under esbuild#1921][4]
and the [prototype][5] was done after a day.

## Install

```bash
npm add -D @hyrious/esbuild-plugin-commonjs
```

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
commonjs({ filter: /\.c?js$/, transform: false })
```

**filter** (default: `/\.c?js$/`)

A RegExp passed to [`onLoad()`](https://esbuild.github.io/plugins/#on-load) to
match commonjs modules, it is recommended to set a custom filter to skip files
for better performance.

**requireReturnsDefault** (default: `true`)

```ts
requireReturnsDefault: boolean | ((path: string) => boolean)
```

Controls which style of import statement to use replacing require calls in commonjs modules.

```js
// input
const foo = require('foo')

// output if requireReturnsDefault is true (default behavior)
import foo from 'foo'

// output if requireReturnsDefault is false
import * as foo from 'foo'
```

**ignore**

Do not convert require calls to these modules. Note that this will cause esbuild
to generate `__require()` wrappers and throw errors at runtime.

```ts
ignore: string[] | ((path: string) => boolean)
```

**transform** (default: `false`)

Try to transform commonjs to es modules. This trick is done with [`cjs-module-lexer`](https://github.com/nodejs/cjs-module-lexer)
to match the native (node) behavior as much as possible. Because this
transformation may cause many bugs around the interop between cjs and esm,
it can also accept a function to filter in the "safe to convert" modules by yourself.

```ts
transform: boolean | ((path: string) => {
  behavior?: "node" | "babel", exports?: string[], sideEffects?: boolean
} | null | void)
```

By default, if you toggle `transform` to `true`, it will convert this code:

```js
exports.__esModule = true
exports.default = {}
exports.foo = 42
```

To this:

<!-- prettier-ignore -->
```js
var exports = {}, module = { exports };
{
  exports.__esModule = true;
  exports.default = {};
  exports.foo = 42;
}
export default exports;
var { foo } = exports;
export { foo };
```

## This is not equal to [@rollup/plugin-commonjs][2].

This plugin does not convert your commonjs file into es modules, it just
replace those `require("x")` expressions with import statements. It turns out
that esbuild can handle this kind of mixed module (having import statement and
`module.exports` at the same time) correctly.

The one acting the same exists in the branch <q>rollup</q>, but is not a good
solution. It depends on a feature [<q>syntheticNamedExports</q>][3] and evanw
(the author of esbuild) doesn't want to implement something out of spec.
Without which you have to tell the plugin every single commonjs file's named
exports, which sucks obviously.

## Changelog

### 0.2.0

Add experimental option `transform` and `transformConfig`.

### 0.2.3

Add options `requireReturnsDefault` and `ignore`.

## License

MIT @ [hyrious](https://github.com/hyrious)

[1]: https://github.com/evanw/esbuild/issues/1467
[2]: https://github.com/rollup/plugins/blob/master/packages/commonjs
[3]: https://github.com/evanw/esbuild/issues/1919
[4]: https://github.com/evanw/esbuild/issues/1921#issuecomment-1010490128
[5]: https://gist.github.com/hyrious/7120a56c593937457c0811443563e017
