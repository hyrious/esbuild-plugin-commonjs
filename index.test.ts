import { build } from "esbuild";
import { commonjs } from "./index";

build({
  entryPoints: ["fixture/entry.ts"],
  bundle: true,
  plugins: [commonjs()],
  format: "esm",
  external: ["react"],
}).catch(() => process.exit(1));
