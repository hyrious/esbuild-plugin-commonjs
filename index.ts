import rollup_commonjs, { RollupCommonJSOptions } from "@rollup/plugin-commonjs";
import { Options as AcornOptions, parse } from "acorn";
import { Plugin } from "esbuild";
import { promises } from "fs";
import { basename, dirname, relative } from "path";

export interface CommonJSPluginOptions {
  /**
   * which files to apply the conversion of commonjs → esm.
   * @default /\.c?js$/
   */
  filter?: RegExp;

  /**
   * fix re-export names
   * @example
   * exports: [
   *   [/...\/react\.js/, ['createElement']]
   * ]
   */
  exports?: [filter: RegExp, names: string[]][];

  /**
   * options passed to @rollup/plugin-commonjs, not all of them are supported.
   */
  options?: RollupCommonJSOptions;
}

export function commonjs({ filter = /\.c?js$/, exports = [], options }: CommonJSPluginOptions = {}): Plugin {
  return {
    name: "commonjs",
    setup({ onResolve, onLoad, resolve, esbuild, initialOptions }) {
      const cwd = process.cwd();
      const outdir =
        initialOptions.outdir || (initialOptions.outfile ? dirname(initialOptions.outfile) : cwd);
      const entries = initialOptions.entryPoints ? Object.values(initialOptions.entryPoints) : [];
      const { resolveId, load, transform, moduleParsed } = rollup_commonjs(options);

      const transformContext = {
        parse: (input: string, options?: AcornOptions) =>
          parse(input, {
            ecmaVersion: "latest",
            sourceType: "module",
            ...options,
          }),

        error: (base: any, props?: any) => {
          let error = base;
          if (!(base instanceof Error)) error = Object.assign(new Error(base.message), base);
          if (props) Object.assign(error, props);
          throw error;
        },

        getModuleInfo: (moduleId: string) => {
          return { isEntry: entries.includes(moduleId) };
        },
      };

      const unify = (result: any, prop = "code") =>
        typeof result === "string" ? { [prop]: result } : result;

      const isUnchanged = (result: any) => !result || result.meta?.commonjs?.isCommonJS === false;

      onLoad({ filter, namespace: "file" }, async args => {
        const code = await promises.readFile(args.path, "utf8");
        const transformed = unify(await transform.call(transformContext, code, args.path));
        if (isUnchanged(transformed)) return null;
        let { code: js, map, syntheticNamedExports } = transformed;

        if (syntheticNamedExports) {
          const rewrite = exports.find(([filter]) => filter.test(args.path));
          if (rewrite) {
            const namedExports = rewrite[1];
            let right = js.lastIndexOf(` as ${syntheticNamedExports}`);
            let left = js.lastIndexOf("{ ", right);
            let start = js.lastIndexOf("export ", left);
            let end = js.indexOf("}", right);
            const isReExport = js.slice(end + 1).startsWith(" from");
            if (isReExport) {
              js = `${js.slice(0, start)}import ${js.slice(left)}; export { ${js.slice(right + 4, end)} };`;
              for (const name of namedExports) {
                js += ` export var ${name} = syntheticNamedExports[${JSON.stringify(name)}];`;
              }
            } else {
              let variable = js.slice(left + 2, right);
              for (const name of namedExports) {
                js += `; export var ${name} = ${variable}[${JSON.stringify(name)}]`;
              }
            }
          }
        }

        map.sources = [basename(args.path)];
        map.sourcesContent = [code];
        return { contents: js + `\n//# sourceMappingURL=${map.toUrl()}` };
      });

      const context = {
        resolving: new Set<string>(),
        resolve: async (path: string, importer: string, { skipSelf = true } = {}) => {
          const key = `${path}:${importer}`;
          if (context.resolving.has(key) && skipSelf)
            throw new Error("[esbuild-plugin-commonjs]: not able to skipSelf");
          context.resolving.add(key);
          const result = await resolve(path, { importer, resolveDir: dirname(importer) });
          context.resolving.delete(key);
          return { id: result.path, external: result.external };
        },
      };

      onResolve({ filter: /^\0/ }, async args => {
        const { id, external } = unify(await resolveId.call(context, args.path, args.importer, {}), "id");
        if (id[0] === "\0") return { path: id, namespace: "commonjs-virtual-module", pluginData: args };
        return { path: id, external };
      });

      onLoad({ filter: /.*/, namespace: "commonjs-virtual-module" }, async args => {
        if (args.path.endsWith("?commonjs-proxy")) {
          moduleParsed({ id: args.path.slice(1, -15), meta: { commonjs: { isCommonJS: true } } });
        }
        const resolveDir = args.pluginData?.resolveDir;
        let loaded = unify(await load(args.path));

        if (args.path.endsWith("?commonjs-module") && loaded.code.includes(" as __module}")) {
          let right = loaded.code.lastIndexOf(" as __module}");
          let left = loaded.code.lastIndexOf("{", right);
          let name = loaded.code.slice(left + 1, right);
          loaded.code += `\nexport var exports = ${name}["exports"]`;
        }

        try {
          // try to make sourcemap point back to the original file
          const { code, warnings } = await esbuild.transform(loaded.code, {
            sourcefile: relative(outdir, args.path.replace(/^\0/, "")),
            sourcemap: "inline",
          });
          return { contents: code, warnings, resolveDir };
        } catch {
          return { contents: loaded.code, resolveDir };
        }
      });
    },
  };
}
