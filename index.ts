import type { Message, Plugin } from "esbuild";
import { promises } from "fs";
import { Lexer } from "./lexer";

export interface CommonJSOptions {
  /**
   * The regexp passed to onLoad() to match commonjs files.
   * @default /\.c?js$/
   */
  filter?: RegExp;
}

export function commonjs({ filter = /\.c?js$/ }: CommonJSOptions = {}): Plugin {
  return {
    name: "commonjs",
    setup({ onLoad, esbuild }) {
      let esbuild_shim: typeof import("esbuild") | undefined;
      const require_esbuild = () => esbuild || (esbuild_shim ||= require("esbuild"));
      const read = promises.readFile;
      const lexer = new Lexer();

      onLoad({ filter }, async args => {
        let contents: string;
        try {
          contents = await read(args.path, "utf8");
        } catch {
          return null;
        }

        function makeName(path: string) {
          let name = `__import_${path
            .replace(/-(\w)/g, (_, x) => x.toUpperCase())
            .replace(/[^$_a-zA-Z0-9]/g, "_")}`;

          if (contents.includes(name)) {
            let suffix = 2;
            while (contents.includes(`${name}_${suffix}`)) suffix++;
            name = `${name}_${suffix}`;
          }

          return name;
        }

        let warnings: Message[];
        try {
          ({ warnings } = await require_esbuild().transform(contents, { format: "esm", logLevel: "silent" }));
        } catch (err) {
          ({ warnings } = err);
        }

        let lines = contents.split("\n");

        if (warnings && (warnings = warnings.filter(e => e.text.includes('"require" to "esm"'))).length) {
          let edits: [start: number, end: number, replace: string][] = [];
          let imports: string[] = [];

          for (const { location } of warnings) {
            if (location === null) continue;

            const { line, lineText, column, length } = location;

            const leftBrace = column + length + 1;
            const path = lexer.readString(lineText, leftBrace);
            if (path === null) continue;
            const rightBrace = lineText.indexOf(")", leftBrace + 2 + path.length) + 1;

            let name = makeName(path);
            let import_statement = `import ${name} from ${JSON.stringify(path)};`;

            // TODO: optimize this calculation by caching sums
            let offset = lines
              .slice(0, line - 1)
              .map(line => line.length)
              .reduce((a, b) => a + 1 + b, 0);

            edits.push([offset + column, offset + rightBrace, name]);
            imports.push(import_statement);
          }

          if (imports.length === 0) return null;
          // TODO: maybe should keep order after unique
          imports = [...new Set(imports)];

          let offset = 0;
          for (const [start, end, name] of edits) {
            contents = contents.slice(0, start + offset) + name + contents.slice(end + offset);
            offset += name.length - (end - start);
          }

          contents = [...imports, "module.exports;", contents].join("");

          return { contents };
        }
      });
    },
  };
}

export default commonjs;
