import { map } from 'rxjs/operators';

import { DeltaObservable, IdObject, MapDelta } from '../../types';
import { DeltaSet } from '../../delta-set/delta-set';

/**
 * RxJS operator that executes the specified _mappingFunction_ to all _created_ and _updated_ elements.
 */
export function mapDelta<
  VO extends Readonly<IdObject<KO>>, // Value Origin
  VM extends IdObject<KM>,           // Value Mapped
  KO = string,                       // Key Origin
  KM = string                        // Key Mapped 
>(mappingFunction: (entry: VO) => VM): (delta: DeltaObservable<KO, VO>) => DeltaObservable<KM, VM> {
  const mapSet = new DeltaSet<VM, KM>();
  mapSet.pauseDelta();

  return map((delta: MapDelta<KO, VO>) => {
    if (delta.all.size === 0) {
      // optimization for empty source map
      mapSet.clear();
    } else {
      mapEntries(delta.modified);
      mapEntries(delta.added);
      deleteEntries(delta.deleted);
    }
    const newDelta = mapSet.getDelta();
    mapSet.clearDelta();
    return newDelta;
  });

  function mapEntries(set: ReadonlyMap<KO, VO>) {
    for (const entry of set.values()) {
      mapSet.add(mappingFunction(entry));
    }
  }

  function deleteEntries(set: ReadonlyMap<KO, VO>) {
    for (const entry of set.values()) {
      mapSet.delete(mappingFunction(entry).id);
    }
  }
}
