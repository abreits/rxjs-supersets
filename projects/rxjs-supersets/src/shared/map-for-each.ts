export function mapForEach<K, V>(map: ReadonlyMap<K, V>, fn?: (value: V) => void) {
  if (fn) {
    for (const entry of map.values()) {
      fn(entry);
    }
  }
}