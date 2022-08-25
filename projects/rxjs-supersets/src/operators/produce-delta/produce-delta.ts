import { Observable } from 'rxjs';
import { produce } from 'immer';

import { IdObject, MapDelta } from '../../types';
import { mapDelta } from '../map-delta/map-delta';

/**
 * RxJS operator that executes the specified _mappingFunction_ to all _created_ and _updated_ elements
 * and returns a new element of the same type.
 */
export function produceDelta<V1 extends Readonly<IdObject<K>>, K = string>(mappingFunction: (element: V1) => V1):
  (delta: Observable<MapDelta<K, V1>>) => Observable<MapDelta<K, V1>> {
  return mapDelta(source => produce(source, mappingFunction));
}
