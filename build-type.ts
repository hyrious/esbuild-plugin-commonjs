import { rollup } from "rollup";
import dts from "rollup-plugin-dts";
import ts from "typescript";
import { peerDependencies } from "./package.json";
import { compilerOptions } from "./tsconfig.json";

const start = Date.now();

const bundle = await rollup({
  input: "./index.ts",
  output: { file: "index.d.ts" },
  plugins: [
    dts({
      compilerOptions: {
        ...ts.parseJsonConfigFileContent({ compilerOptions }, ts.sys, ".").options,
        declaration: true,
        noEmit: false,
        emitDeclarationOnly: true,
        noEmitOnError: true,
        checkJs: false,
        declarationMap: false,
        skipLibCheck: true,
        preserveSymlinks: false,
      },
    }),
  ],
  external: Object.keys(peerDependencies),
});

const result = await bundle.write({
  dir: ".",
  format: "esm",
  exports: "named",
});

console.log(`Built ${result.output.map(e => e.fileName).join(", ")} in ${Math.floor(Date.now() - start)}ms`);
