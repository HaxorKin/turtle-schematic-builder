export function setTryToAdd<T>(set: Set<T>, value: T): boolean {
  const prevSize = set.size;
  set.add(value);
  return set.size > prevSize;
}

export function mapTryToAdd<K, V>(map: Map<K, V>, key: K, value: V): boolean {
  const prevSize = map.size;
  map.set(key, value);
  return map.size > prevSize;
}
