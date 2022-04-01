import { ReplaySubject } from 'rxjs';

import { IsModified, MapDelta, DeltaMapSettings } from '../types';

/**
 * A Map that publishes changes through the _delta$_ Observable.
 */
export class DeltaMap<K, V> extends Map<K, V> implements ReadonlyMap<K, V> {
  private deltaSubject$ = new ReplaySubject<MapDelta<K, V>>(1);
  public delta$ = this.deltaSubject$.asObservable();

  private added!: Map<K, V>;
  private deleted!: Map<K, V>;
  private modified!: Map<K, V>;
  private existedBeforeDelta?: Set<K>;

  private publishEmpty = true;
  private publish = true;

  protected isModified?: IsModified<V>;

  constructor();
  constructor(entries: Iterable<Iterable<any>>);
  constructor(settings?: DeltaMapSettings<V>);
  constructor(entries: Iterable<Iterable<any>>, settings?: DeltaMapSettings<V>);
  constructor(
    entriesOrSettings?: Iterable<Iterable<any>> | DeltaMapSettings<V>,
    settings?: DeltaMapSettings<V>
  ) {
    super();
    this.initializeDelta();
    if (entriesOrSettings && Symbol.iterator in Object(entriesOrSettings)) {
      const entries = entriesOrSettings as Iterable<[K, V]>;
      for (const entry of entries) {
        this.doSet(entry[0], entry[1]);
      }
    }
    if (!settings) {
      settings = entriesOrSettings as DeltaMapSettings<V>;
    }
    if (settings) {
      this.initializeSettings(settings as DeltaMapSettings<V>);
    }
  }

  /**
   * Process constructor settings, can be overriden and extended in subsclasses
   */
  protected initializeSettings(settings: DeltaMapSettings<V>): void {
    this.isModified = settings.isModified;
    this.publishEmpty = settings.publishEmpty === undefined ? true : settings.publishEmpty;
  }

  private initializeDelta(): void {
    this.added = new Map<K, V>();
    this.deleted = new Map<K, V>();
    this.modified = new Map<K, V>();
    this.existedBeforeDelta = undefined;
  }

  /**
   * Publish modification to delta$ if there are changes or if it is the first time called.
   */
  protected publishDelta(): void {
    if (this.publish && (this.added.size > 0 || this.modified.size > 0 || this.deleted.size > 0 || this.publishEmpty)) {
      this.deltaSubject$.next({
        all: this,
        added: this.added,
        modified: this.modified,
        deleted: this.deleted
      });
      this.publishEmpty = false;
      this.initializeDelta();
    }
  }

  /**
   * @returns _true_ if the ObservableMap _delta$_ has subscribers
   */
  get observed(): boolean {
    return this.deltaSubject$.observed;
  }

  /**
   * Pauses and combines all delta updates until _resumeDelta_ is called.
   */
  pauseDelta(): void {
    this.publish = false;
  }

  /**
   * Publishes all pending _added_, _modified_ or _deleted_ entries if there are any.
   */
  resumeDelta(): void {
    this.publish = true;
    this.publishDelta();
  }

  /**
   * Adds or modifies an entry and notifies changes through _delta$_.
   * 
   * If an existing entry is the same according to the _compare_ function, nothing is changed
   * @override
    */
  override set(id: K, value: V): any {
    this.doSet(id, value);
    this.publishDelta();
    return this;
  }

  /**
   * _set_ delta logic.
   * Determines if it is an _add_ or a _modify_ and updates the delta. 
   * Can be extended and/or overridden in subclasses
   */
  protected doSet(id: K, value: V): void {
    if (this.added.has(id)) {
      // already in added, update add
      super.set(id, value);
      this.added.set(id, value);
    } else {
      this.deleted.delete(id);
      const prevEntry = this.get(id);
      if (prevEntry) {
        // existing entry
        if (!this.isModified || this.isModified(value, prevEntry)) {
          // modified entry
          super.set(id, value);
          this.modified.set(id, value);
        }
      } else {
        // new entry
        super.set(id, value);
        if (this.existedBeforeDelta?.has(id)) {
          this.modified.set(id, value);
        } else {
          this.added.set(id, value);
        }
      }
    }
  }

  /**
   * Deletes an entry and notifies deletions through _delta$_ if the entry exists.
   * @override
   */
  override delete(id: K): any {
    const deleted = this.doDelete(id);
    this.publishDelta();
    return deleted;
  }

  /**
   * _delete_ delta logic.
   * Determines if it exists and updates the delta. 
   * Can be extended and/or overridden in subclasses
   */
  protected doDelete(id: K): any {
    const deletedItem = this.get(id);
    super.delete(id);
    if (this.added.has(id)) {
      this.added.delete(id);
      return true;
    } else {
      if (deletedItem) {
        if (!this.publish) {
          if (!this.existedBeforeDelta) {
            this.existedBeforeDelta = new Set<K>();
          }
          this.existedBeforeDelta.add(id);
        }
        this.modified.delete(id);
        this.deleted.set(id, deletedItem);
        return true;
      }
      return false;
    }
  }

  /**
   * Clears all entries and notifies deletions through _delta$_.
   * @override
   */
  override clear(): any {
    if (this.deltaSubject$.observed) {
      this.forEach((value, key) => this.deleted.set(key,value));
      this.publishDelta();
    }
    super.clear();
  }

  /**
   * Clears any remaining entries and completes the delta$ observable
   */
  destroy(): void {
    this.resumeDelta();
    this.clear();
    this.deltaSubject$.complete();
  }
}
