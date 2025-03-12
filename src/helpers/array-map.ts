export function addToArrayMap<K, V>(
  arrayMap: Map<K, V[]>,
  key: K,
  value: V,
): Map<K, V[]> {
  const existingArray = arrayMap.get(key);
  if (existingArray) {
    existingArray.push(value);
  } else {
    arrayMap.set(key, [value]);
  }
  return arrayMap;
}
