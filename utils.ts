export function orderedUniq<T>(array: T[]) {
  // prettier-ignore
  let ret: T[] = [], visited = new Set<T>();
  for (let val of array) if (!visited.has(val)) visited.add(val), ret.push(val);
  return ret;
}

export function cachedReduce<S, T>(array: T[], reducer: (s: S, a: T) => S, s: S) {
  // prettier-ignore
  let cache = [s], cacheLen = 1, last = s;
  return (len: number) => {
    while (cacheLen <= len) cacheLen = cache.push((last = reducer(last, array[cacheLen - 1])));
    return cache[len];
  };
}
