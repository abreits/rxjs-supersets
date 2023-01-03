import { DeltaSet } from '../delta-set/delta-set';
import { DeltaMapSettings, MemberObject, SimpleSubsetMap, } from '../types';


/**
 * A `DeltaSet` with `MemberObjects` that are member of 0 or more SubSets.
 * 
 * A `subset` is a `DeltaSet` containing all `MemberObjects` that are `memberOf` the `subset` 
 * (i.e. have the `subsetId` in its `memberOf` property)
 * 
 * Allows you to automatically keep track of each subset content:
 * - Subscribe to subset `delta$` to get all changes
 * - If the entry is not `memberOf` any subsets any more it will be deleted from the `SuperSet`
 */
export class SimpleSuperSet<V extends MemberObject<K, M>, K = string, M = string> extends DeltaSet<V, K> {
  protected _subsets = new Map<M, Map<K, V>>();
  
  /**
   * The subsetMap, containing all subset specific methods and properties
   * 
   */
  readonly subsets: SimpleSubsetMap<M, ReadonlyMap<K, V>> = {
    get: key => this.getSubSet(key),
    entries: () => this._subsets.entries(),
    forEach: fn => this._subsets.forEach(fn),
    has: key => this._subsets.has(key),
    keys: () => this._subsets.keys(),
    size: 0, // getter replaced in constructor
    values: () => this._subsets.values(),
    [Symbol.iterator]: () => this._subsets[Symbol.iterator](),
    empty: key => this.emptySubSet(key),
    delete: key => this.deleteSubSet(key)
  };

  constructor();
  constructor(map: Iterable<Iterable<any>>);
  constructor(settings?: DeltaMapSettings<V>);
  constructor(map: Iterable<Iterable<any>>, settings?: DeltaMapSettings<V>);
  constructor(
    arg1?: Iterable<Iterable<any>> | DeltaMapSettings<V>,
    arg2?: DeltaMapSettings<V>
  ) {
    super(arg1 as any, arg2);


    // pass through the _subsets.size to subsets.size
    Object.defineProperty(this.subsets, 'size', {
      get: () => this._subsets.size
    });
  }

  /**
   * @returns subset for the specified id, if it does not exist, it creates a new subset
   */
  protected getSubSet(subsetId: M): Map<K, V> {
    let subset = this._subsets.get(subsetId);
    if (!subset) {
      subset = new Map<K, V>();
      this._subsets.set(subsetId, subset);
    }
    return subset;
  }

  /**
   * Adds or modifies a MemberObject entry, notifies changes through _delta$_.
   * Also notifies the observed subsets that are involved.
   * 
   * If an existing entry is the same according to the _isEqual_ function, nothing is changed.
   * @override
   */
  override add(entry: V, mergeExistingSubsets = false): SimpleSuperSet<V, K, M> {
    this.doAdd(entry, mergeExistingSubsets);
    this.publishDelta();
    return this;
  }

  protected doAdd(entry: V, mergeExistingSubsets: boolean) {
    if (mergeExistingSubsets) {
      const previtem = this.get(entry.id);
      previtem?.memberOf.forEach(subset => entry.memberOf.add(subset));
    }
    if (entry.memberOf.size === 0) {
      this.doDelete(entry.id);
    } else {
      this.doSet(entry.id, entry);
    }
  }

  /**
   * Extend _super.doSet_ to add subset processing
   * @override
   */
  protected override doSet(id: K, entry: V): void {
    const previtem = this.get(entry.id);
    super.doSet(id, entry);
    this.updateSubsets(entry, previtem);
  }

  protected updateSubsets(entry: V, previtem: V | undefined) {
    const newCategories = entry.memberOf;
    const oldCategories = previtem ? previtem.memberOf : new Set<M>();
    // remove entry from subsets it is no longer member of
    oldCategories.forEach(subsetId => {
      if (!newCategories.has(subsetId)) {
        // delete the entry from all subsets it is member of (subsets.get should always return a value here)
        (this._subsets.get(subsetId) as Map<K, V>).delete(entry.id);
      }
    });
    // add entry to all new subsets
    newCategories.forEach(subset => {
      this.getSubSet(subset).set(entry.id, entry);
    });
  }

  /**
    * extend _super.doDelete_ to add subset processing
    * @override
    */
  protected override doDelete(id: K): any {
    const entry = this.get(id);
    if (entry) {
      entry.memberOf.forEach((_: any, subsetId: M) => (this._subsets.get(subsetId) as Map<K, V>).delete(id));
    }
    return super.doDelete(id);
  }

  /**
   * Empties the subset, deleting all entries from the subset.
   * 
   * Items that are no longer member of another Subset will also be deleted from the SuperSet
   */
  protected emptySubSet(subsetId: M): void {
    const subset = this.getSubSet(subsetId);
    subset.forEach(entry => {
      entry.memberOf.delete(subsetId);
      this.add(entry);
    });
    subset.clear();
  }

  /**
   * Deletes the entries in the subset from the SuperSet
   */
  deleteSubSetItems(subsetId: M): void {
    const subset = this.getSubSet(subsetId);
    subset.forEach(entry => {
      this.doDelete(entry.id);
    });
    subset.clear();
    this.publishDelta();
  }

  /**
   * Deletes the subset:
   * - Empties the subset
   * - Deletes the subset from the SuperSet
   */
  protected deleteSubSet(subsetId: M): void {
    this.emptySubSet(subsetId);
    this._subsets.delete(subsetId);
    this.publishDelta();
  }
}
