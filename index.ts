import rollup_commonjs, { RollupCommonJSOptions } from "@rollup/plugin-commonjs";
import { Options as AcornOptions, parse } from "acorn";
import { Plugin } from "esbuild";
import { promises } from "fs";
import { dirname } from "path";

export interface CommonJSPluginOptions {
  /**
   * which files to apply the conversion of commonjs → esm.
   * @default /\.c?js$/
   */
  filter?: RegExp;

  /**
   * which files to use cache, the cached files are stored at
   * node_modules/.esbuild-plugin-commonjs.
   * @default true
   */
  cache?: boolean | RegExp | ((path: string) => boolean);

  /**
   * options passed to @rollup/plugin-commonjs, not all of them are supported.
   */
  options?: RollupCommonJSOptions;
}

export function commonjs({ filter = /\.c?js$/, cache = true, options }: CommonJSPluginOptions = {}): Plugin {
  return {
    name: "commonjs",
    setup({ onResolve, onLoad, resolve }) {
      const { resolveId, load, transform } = rollup_commonjs(options);

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
          console.log("getModuleInfo", { moduleId });
        },
      };

      const unify = (result: any, prop = "code") =>
        typeof result === "string" ? { [prop]: result } : result;

      const isUnchanged = (result: any) => !result || result.meta?.commonjs?.isCommonJS === false;

      onLoad({ filter: /.*/, namespace: "file" }, async args => {
        const code = await promises.readFile(args.path, "utf8");
        const transformed = unify(await transform.call(transformContext, code, args.path));
        if (isUnchanged(transformed)) return null;
        const { code: js, map } = transformed;
        return { contents: js + `\n//# sourceMappingURL=${map.toUrl()}` };
      });

      const context = {
        resolve: async (path: string, importer: string, { skipSelf = true } = {}) => {
          const result = await resolve(path, { importer, resolveDir: dirname(importer) });
          return { id: result.path, external: true };
        },
      };

      onResolve({ filter: /^\0/ }, async args => {
        const { id, external } = unify(await resolveId.call(context, args.path, args.importer, {}), "id");
        if (id[0] === "\0") return { path: id, namespace: "commonjs-virtual-module", pluginData: args };
        return { path: id, external };
      });

      onLoad({ filter: /.*/, namespace: "commonjs-virtual-module" }, async args => {
        const { code } = unify(await load.call(context, args.path));
        return { contents: code, resolveDir: args.pluginData?.resolveDir };
      });
    },
  };
}
