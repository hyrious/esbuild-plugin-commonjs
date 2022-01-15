// simulates conditional re-export

if (process.env.NODE_ENV === "production") {
  module.exports = require("./react-dom-production");
} else {
  module.exports = require("./react-dom-development");
}
