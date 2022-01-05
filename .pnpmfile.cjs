exports.hooks = {
  readPackage(pkg, _context) {
    // remove peer deps warnings about these packages
    // because we are going to apply hacks
    if (pkg.name.startsWith("@rollup")) {
      delete pkg.peerDependencies.rollup;
    }
    return pkg;
  },
};
