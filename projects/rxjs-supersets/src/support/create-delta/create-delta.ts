import { IdObject, MapDelta } from '../../types';

/**
 * Utility function to quickly create a `delta$` `DeltaMap<V>` for use in unit tests
 */
export function createDelta<V extends IdObject<K>, K = string>(from: {
  all?: V | V[],
  added?: V | V[],
  modified?: V | V[],
  deleted?: V | V[]
}): MapDelta<K, V> {
  function createMap(elements?: V | V[]): Map<K, V> {
    const result = new Map<K, V>();
    if (Array.isArray(elements)) {
      elements.map(element => {
        result.set(element.id, element);
      });
    } else if (elements) {
      result.set(elements.id, elements);
    }
    return result;
  }

  return {
    all: createMap(from.all),
    added: createMap(from.added),
    modified: createMap(from.modified),
    deleted: createMap(from.deleted),
  };
}
