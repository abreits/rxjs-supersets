import { Observable, Subscription, using } from 'rxjs';
import { DeltaSet, processDelta } from '../../public-api';

import { IdObject, MapDelta } from '../../types';


export function mergeDelta<K, V extends IdObject<K>>(...args: Observable<MapDelta<K, V>>[]): Observable<MapDelta<K, V>> {
  const mergeSet = new DeltaSet<V, K>();

  return using(() => new MergeSubscriber(mergeSet, args), () => mergeSet.delta$);
}

class MergeSubscriber<K, V extends IdObject<K>> {
  private subscriptions: Subscription[];
  private sourceSets = new Map<number, ReadonlyMap<K, V>>();

  constructor(private mergeSet: DeltaSet<V, K>, sources: Observable<MapDelta<K, V>>[]) {
    this.subscriptions = sources.map((source, index) => source.pipe(
      processDelta({
        before: delta => {
          this.sourceSets.set(index, delta.all);
          this.mergeSet.pauseDelta();
        },
        add: element => this.mergeSet.add(element),
        modify: element => this.mergeSet.add(element),
        delete: element => this.deleteElement(element.id, index),
        after: () => this.mergeSet.resumeDelta()
      })
    ).subscribe());
  }

  private deleteElement(elementId: K, setId: number) {
    if (!this.inOtherSet(elementId, setId)) {
      this.mergeSet.delete(elementId);
    }
  }

  private inOtherSet(elementId: K, setId: number) {
    for (const [sourceSetId, sourceSet] of this.sourceSets) {
      if (sourceSetId === setId) break;
      if (sourceSet.has(elementId)) return true;
    }
    return false;
  }

  unsubscribe() {
    this.sourceSets.clear();
    this.mergeSet.clear();
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
