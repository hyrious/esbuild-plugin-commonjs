declare module "find-cache-dir" {
  export default function findCacheDir(options?: {
    name: string;
    create?: boolean;
    thunk: true;
  }): (...parts: string[]) => string;
  export default function findCacheDir(options?: { name: string; create?: boolean }): string;
}
