import { produce } from 'immer';

import { DeltaObservable, IdObject } from '../../types';
import { mapDelta } from '../map-delta/map-delta';

/**
 * RxJS operator that executes the specified _mappingFunction_ to all _created_ and _updated_ elements
 * and returns a new element of the same type.
 */
export function produceDelta<
  V extends Readonly<IdObject<K>>,
  K = string
>(mappingFunction: (element: V) => V): (delta: DeltaObservable<K, V>) => DeltaObservable<K, V> {
  return mapDelta(source => produce(source, mappingFunction));
}
