import { build } from "esbuild";
import { relative } from "path";
import { commonjs } from "./index";

const result = await build({
  entryPoints: ["fixture/export-react-dom.js"],
  bundle: true,
  external: ["react"],
  format: "esm",
  plugins: [commonjs()],
  minifySyntax: true,
  sourcemap: "external",
  write: false,
  outdir: "dist",
}).catch(() => process.exit(1));

for (const { path, text } of result.outputFiles) {
  const file = relative(process.cwd(), path);
  console.log("====", file, "==== begin");
  console.log(text);
  console.log("====", file, "==== end");
}
