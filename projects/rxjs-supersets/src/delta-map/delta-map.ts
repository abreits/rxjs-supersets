import { ReplaySubject } from 'rxjs';

import { IsModified, MapDelta, DeltaMapSettings } from '../types';

/**
 * A Map that publishes changes through the _delta$_ Observable.
 */
export class DeltaMap<K, V> extends Map<K, V> implements ReadonlyMap<K, V> {
  private deltaSubject$ = new ReplaySubject<MapDelta<K, V>>(1);
  public delta$ = this.deltaSubject$.asObservable();

  private created!: Map<K, V>;
  private deleted!: Map<K, V>;
  private updated!: Map<K, V>;
  private existedBeforeDelta?: Set<K>;

  private publishEmpty = true;
  private publish = true;

  protected isUpdated?: IsModified<V>;

  constructor();
  constructor(entries: Iterable<Iterable<any>>);
  constructor(settings?: DeltaMapSettings<V>);
  constructor(entries: Iterable<Iterable<any>>, settings?: DeltaMapSettings<V>);
  constructor(
    itemsOrSettings?: Iterable<any> | DeltaMapSettings<V>,
    settings?: DeltaMapSettings<V>
  ) {
    super();
    this.initializeDelta();
    if (itemsOrSettings && Symbol.iterator in Object(itemsOrSettings)) {
      this.initializeContent(itemsOrSettings as Iterable<any>);
      this.publishDelta();
    }
    if (!settings) {
      settings = itemsOrSettings as DeltaMapSettings<V>;
    }
    if (settings) {
      this.initializeSettings(settings as DeltaMapSettings<V>);
    }
  }

  /**
   * Process constructor content, can be overriden and extended in subclasses 
   */
  protected initializeContent(entries: Iterable<any>): void {
    // expect key value pairs
    for (const entry of entries as Iterable<[K, V]>) {
      this.doSet(entry[0], entry[1]);
    }
  }

  /**
   * Process constructor settings, can be overriden and extended in subclasses
   */
  protected initializeSettings(settings: DeltaMapSettings<V>): void {
    this.isUpdated = settings.isUpdated;
    this.publishEmpty = settings.publishEmpty === undefined ? true : settings.publishEmpty;
  }

  private initializeDelta(): void {
    this.created = new Map<K, V>();
    this.deleted = new Map<K, V>();
    this.updated = new Map<K, V>();
    this.existedBeforeDelta = undefined;
  }

  /**
   * Publish modification to delta$ if there are changes or if it is the first time called.
   */
  protected publishDelta(): void {
    if (this.publish && (this.created.size > 0 || this.updated.size > 0 || this.deleted.size > 0 || this.publishEmpty)) {
      this.deltaSubject$.next({
        all: this,
        created: this.created,
        updated: this.updated,
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
    if (this.created.has(id)) {
      // already in created, update add
      super.set(id, value);
      this.created.set(id, value);
    } else {
      this.deleted.delete(id);
      const prevEntry = this.get(id);
      if (prevEntry) {
        // existing entry
        if (!this.isUpdated || this.isUpdated(value, prevEntry)) {
          // updated entry
          super.set(id, value);
          this.updated.set(id, value);
        }
      } else {
        // new entry
        super.set(id, value);
        if (this.existedBeforeDelta?.has(id)) {
          this.updated.set(id, value);
        } else {
          this.created.set(id, value);
        }
      }
    }
  }

  /**
   * Deletes an entry and notifies deletions through _delta$_ if the entry exists.
   * @override
   */
  override delete(id: K): boolean {
    const deleted = this.doDelete(id);
    this.publishDelta();
    return deleted;
  }

  /**
   * _delete_ delta logic.
   * Determines if it exists and updates the delta. 
   * Can be extended and/or overridden in subclasses
   */
  protected doDelete(id: K): boolean {
    const deletedItem = this.get(id);
    super.delete(id);
    if (this.created.has(id)) {
      this.created.delete(id);
      return true;
    } else {
      if (deletedItem) {
        if (!this.publish) {
          if (!this.existedBeforeDelta) {
            this.existedBeforeDelta = new Set<K>();
          }
          this.existedBeforeDelta.add(id);
        }
        this.updated.delete(id);
        this.deleted.set(id, deletedItem);
        return true;
      }
      return false;
    }
  }

  /**
   * Deletes multiple entries at once and notifies changes through _delta$_.
   */
  deleteMultiple(entrieIds: Iterable<K>): void {
    for (const entryId of entrieIds) {
      this.doDelete(entryId);
    }
    this.publishDelta();
  }

  /**
   * Clears all entries and notifies deletions through _delta$_.
   * @override
   */
  override clear(): any {
    if (this.deltaSubject$.observed) {
      this.forEach((value, key) => this.deleted.set(key, value));
      this.publishDelta();
    }
    super.clear();
  }

  /**
   * Clears any remaining entries and completes the delta$ observable
   */
  close(): void {
    this.resumeDelta();
    this.clear();
    this.deltaSubject$.complete();
  }
}
