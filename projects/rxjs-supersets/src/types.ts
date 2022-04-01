import { Observable } from 'rxjs';

export interface DeltaMapSettings<T> {
  isModified?: IsModified<T>; // function to determine whether an existing entry is modified
  publishEmpty?: boolean;     // always publish delta on first action, even if the map is still empty (default: true)
}

export interface SuperSetSettings<T> extends DeltaMapSettings<T> {
  subsets?: DeltaMapSettings<T>; // delta settings for the categories
}

export interface IdObject<K = string> {
  id: K
}

export interface MemberObject<K = string, C = string> extends IdObject<K> {
  memberOf: Set<C>;
}

export interface ReadonlyDeltaMap<K, V> extends ReadonlyMap<K, V> {
  readonly delta$: DeltaObservable<K, V>;
}

export interface SubsetMap<K, V> extends ReadonlyMap<K, V> {
  get(key: K): V;
  empty(key: K): void;
  delete(key: K): void;
}

export interface MapDelta<K, V> {
  all: ReadonlyMap<K, Readonly<V>>;
  added: ReadonlyMap<K, Readonly<V>>;
  deleted: ReadonlyMap<K, Readonly<V>>;
  modified: ReadonlyMap<K, Readonly<V>>;
}

export type DeltaObservable<K, V> = Observable<MapDelta<K, V>>

/**
 * Compare function, that returns _true_ if the current value has been modified.
 */
export type IsModified<T> = (current: T, previous: T) => boolean;

/**
 * preferred minimal way to implement a mappable (external) read-only source
 */
export interface MappedSourceReader<K, V extends IdObject> {
  delta$: DeltaObservable<K, V>;
  get(id: K): Observable<V | undefined>;
}

/**
 * preferred minimal way to implement a mappable (external) source
 */
export interface MappedSource<K, V extends IdObject> extends MappedSourceReader<K, V> {
  set(entry: V): Observable<V>;
  delete(id: K): Observable<boolean>;
}
