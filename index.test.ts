import { build } from "esbuild";
import { commonjs } from "./index";

build({
  entryPoints: ["fixture/export-react-dom.js"],
  bundle: true,
  external: ["react"],
  format: "esm",
  plugins: [commonjs()],
  minifySyntax: true,
}).catch(() => process.exit(1));
