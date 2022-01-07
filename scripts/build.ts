import { build } from "esbuild";
import { dependencies, peerDependencies } from "../package.json";

build({
  entryPoints: ["index.ts"],
  bundle: true,
  external: Object.keys({
    ...dependencies,
    ...peerDependencies,
  }),
  platform: "node",
  target: "node12",
  outfile: "index.js",
  sourcemap: true,
  sourcesContent: false,
  logLevel: "info",
}).catch(() => process.exit(1));
