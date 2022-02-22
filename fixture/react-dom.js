exports.__esModule = true;
exports.default = {};
exports.foo = 42;

if (process.env.NODE_ENV === "production") {
  exports.render = require("./react-dom-production").render;
} else {
  exports.render = require("./react-dom-development").render;
}
