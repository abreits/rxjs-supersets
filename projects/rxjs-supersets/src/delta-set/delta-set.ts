import { DeltaMap } from '../delta-map/delta-map';
import { IdObject } from '../types';


/**
 * A Set containing IdObjects that publishes changes through the _delta$_ Observable.
 */
export class DeltaSet<V extends IdObject<K>, K = string> extends DeltaMap<K, V> {
  /**
   * Adds or modifies an entry and notifies changes through _delta$_.
   * 
   * If an existing entry is the same according to the _isEqual_ function, nothing is changed.
   */
  add(entry: V): DeltaSet<V, K> {
    super.set(entry.id, entry);
    return this;
  }

  /**
   * Adds or modifies multiple entries at once and notifies changes through _delta$_.
   * 
   * If an existing entry is the same according to the _isEqual_ function, nothing is changed.
   */
  addMultiple(entries: Iterable<V>): void {
    for (const newEntry of entries as Iterable<V>) {
      this.doSet(newEntry.id, newEntry);
    }
    this.publishDelta();
  }

  /**
   * Redirect to _entry.add_ to guarantee integrity of the IdObject Map.
   * @override
   * @deprecated use _add(entry)_ instead
   */
  override set(_id: K, entry: V): any {
    return this.add(entry);
  }

  /**
   * Replaces all existing entries with new entries.
   * - Adds _newEntries_ not existing in the current entries.
   * - Updates existing entries where _newEntries_ have changed (_isEqual_ function).
   * - Deletes entries not existing in _newEntries_.
   */
  replace(entries: Iterable<V>): void {
    const newEntriesSet = new Set<K>();

    // update additions and modifications
    for (const newEntry of entries) {
      newEntriesSet.add(newEntry.id);
      this.doSet(newEntry.id, newEntry);
    }
    // update deletions
    for (const oldEntry of this.values()) {
      if (!newEntriesSet.has(oldEntry.id)) {
        this.doDelete(oldEntry.id);
      }
    }
    this.publishDelta();
  }
}
