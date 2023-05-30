import { Observable } from 'rxjs';

export interface DeltaMapSettings<T> {
  isModified?: IsModified<T>; // function to determine whether an existing entry is modified
  publishEmpty?: boolean;    // always publish delta on first action, even if the map is still empty (default: true)
  copyAll?: boolean;         // create a copy of all map elements for each MapDelta update
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

export interface GroupDeltaSettings<
  VE extends IdObject<KE>,  // Value Entry
  VG extends GroupObject<VE, KG, KE>, // Value Group
  KE = string,                        // Key Entry
  KG = string                         // Key Group
> {
  groupFilter?: (element: VE) => boolean;
  groupIdFunction: (element: VE) => KG;
  GroupObjectType: GroupObjectType<VE, VG, KE, KG>;
}


export declare interface GroupObjectType<
  VE extends IdObject<KE>,  // Value Entry
  VG extends GroupObject<VE, KG, KE>, // Value Group
  KE = string,                        // Key Entry
  KG = string                         // Key Group
> extends Function {
  new(id: KG): VG;
}

export interface GroupObject<T extends IdObject<KE>, KG = string, KE = string> extends IdObject<KG> {

  /**
   * Adds a member to the GroupObject
   */
  add(idObject: T): void;
  /**
   * Removes a member from the GroupObject,
   * should return _true_ if the remaining group is not empty, _false_ if it is
   */
  remove(idObject: T): boolean;
}

export interface ReadonlyDeltaMap<K, V> extends ReadonlyMap<K, V> {
  readonly delta$: DeltaObservable<K, V>;
}

export interface SimpleSubsetMap<K, V> extends ReadonlyMap<K, V> {
  get(key: K): V;
  empty(key: K): void;
  delete(key: K): void;
}

export interface SubsetMap<K, V> extends SimpleSubsetMap<K, V> {
  pauseDeltas(): void;
  resumeDeltas(): void;
}

export interface MapDelta<K, V> {
  all: ReadonlyMap<K, V>;
  added: ReadonlyMap<K, V>;
  deleted: ReadonlyMap<K, V>;
  modified: ReadonlyMap<K, V>;
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
