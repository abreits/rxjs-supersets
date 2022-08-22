import { IdObject, MapDelta } from '../../types';

/**
 * Utility function to make processing every element in a DeltaMap easier
 */
export function processElements<V extends IdObject<K>, K = string>(
  delta: MapDelta<K, V>,
  handlerFunctions: {
    before?: () => void,
    create?: (value: Readonly<V>) => void,
    update?: (value: Readonly<V>) => void,
    delete?: (value: Readonly<V>) => void,
    after?: () => void
  }): void {
  if (handlerFunctions.before) {
    handlerFunctions.before();
  }
  handleElements(delta.deleted, handlerFunctions.delete);
  handleElements(delta.updated, handlerFunctions.update);
  handleElements(delta.created, handlerFunctions.create);
  if (handlerFunctions.after) {
    handlerFunctions.after();
  }

  function handleElements<K, V>(set: ReadonlyMap<K, V>, fn?: (value: V) => void) {
    if (fn) {
      for (const entry of set.values()) {
        fn(entry);
      }
    }
  }
}