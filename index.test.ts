import { build } from "esbuild";
import { commonjs } from "./index";

build({
  entryPoints: ["fixture/entry.ts"],
  bundle: true,
  plugins: [commonjs({ transform: true })],
  minifySyntax: true,
  format: "esm",
  external: ["react"],
  define: {
    "process.env.NODE_ENV": "production",
  },
}).catch(() => process.exit(1));
