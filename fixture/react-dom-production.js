if (process.env.NODE_ENV === "production") {
  var React = require("react");

  exports.render = React.render_production;
}
