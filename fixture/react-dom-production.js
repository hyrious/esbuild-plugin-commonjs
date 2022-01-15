if (process.env.NODE_ENV === "production") {
  var React = require("react");

  module.exports = { render: React.createElement };
}
