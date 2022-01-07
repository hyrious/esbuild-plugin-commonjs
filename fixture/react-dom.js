"use strict";

if (process.env.NODE_ENV === "production") {
  module.exports = require("./react.min.js");
} else {
  module.exports = require("./react.js");
}
