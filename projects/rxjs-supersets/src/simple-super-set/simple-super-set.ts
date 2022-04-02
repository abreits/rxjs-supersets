import { DeltaSet } from '../delta-set/delta-set';
import { IsModified, MemberObject, SimpleSubsetMap, SuperSetSettings } from '../types';


/**
 * A `DeltaSet` with `MemberObjects` that are member of 0 or more SubSets.
 * 
 * A `subset` is a `DeltaSet` containing all `MemberObjects` that are `memberOf` the `SubSet` 
 * (i.e. have the `SubSetId` in its `memberOf` property)
 * 
 * Allows you to automatically keep track of each subset content:
 * - Subscribe to subset `delta$` to get all changes
 * - If the item is not `memberOf` any subsets any more it will be deleted from the `SuperSet`
 */
export class SimpleSuperSet<V extends MemberObject<K, M>, K = string, M = string> extends DeltaSet<V, K> {
  protected _subsets = new Map<M, Map<K, V>>();
  private publishSubSetUpdates = true;

  protected isModifiedSubSet?: IsModified<V>;
  protected publishEmptySubSet!: boolean;

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
  constructor(settings?: SuperSetSettings<V>);
  constructor(map: Iterable<Iterable<any>>, settings?: SuperSetSettings<V>);
  constructor(
    arg1?: Iterable<Iterable<any>> | SuperSetSettings<V>,
    arg2?: SuperSetSettings<V>
  ) {
    super(arg1 as any, arg2);
    if (this.publishEmptySubSet === undefined) {
      this.publishEmptySubSet = true;
    }

    // pass through the _subsets.size to subsets.size
    Object.defineProperty(this.subsets, 'size', {
      get: () => this._subsets.size
    });
  }

  /**
   * @returns SubSet for the specified id, if it does not exist, it creates a new SubSet
   */
  private getSubSet(SubSetId: M): Map<K, V> {
    let SubSet = this._subsets.get(SubSetId);
    if (!SubSet) {
      SubSet = new Map<K, V>();
      this._subsets.set(SubSetId, SubSet);
    }
    return SubSet;
  }

  /**
   * Adds or modifies a MemberObject item, notifies changes through _delta$_.
   * Also notifies the observed subsets that are involved.
   * 
   * If an existing item is the same according to the _isEqual_ function, nothing is changed.
   * @override
   */
  override add(item: V, mergeExistingSubsets = false): SimpleSuperSet<V, K, M> {
    this.doAdd(item, mergeExistingSubsets);
    this.publishDelta();
    return this;
  }

  private doAdd(item: V, mergeExistingSubsets: boolean) {
    if (mergeExistingSubsets) {
      const previtem = this.get(item.id);
      previtem?.memberOf.forEach(subSet => item.memberOf.add(subSet));
    }
    if (item.memberOf.size === 0) {
      this.doDelete(item.id);
    } else {
      this.doSet(item.id, item);
    }
  }

  /**
   * Extend _super.doSet_ to add SubSet processing
   * @override
   */
  protected override doSet(id: K, item: V): void {
    const previtem = this.get(item.id);
    super.doSet(id, item);
    this.updateSubsets(item, previtem);
  }

  /**
   * Adds or modifies multiple MemberObject items at once and notifies changes through _delta$_.
   * Also notifies the observed subsets that are involved. 
   * 
   * If an existing item is the same according to the _isEqual_ function, nothing is changed.
   */
  override addMultiple(items: Iterable<V>, mergeExistingSubsets = false): void {
    for (const item of items) {
      this.doAdd(item, mergeExistingSubsets);
    }
    this.publishDelta();
  }


  private updateSubsets(item: V, previtem: V | undefined) {
    const newCategories = item.memberOf;
    const oldCategories = previtem ? previtem.memberOf : new Set<M>();
    // remove item from subsets it is no longer member of
    oldCategories.forEach(SubSetId => {
      if (!newCategories.has(SubSetId)) {
        // delete the item from all subsets it is member of (subsets.get should always return a value here)
        (this._subsets.get(SubSetId) as Map<K, V>).delete(item.id);
      }
    });
    // add item to all new subsets
    newCategories.forEach(SubSet => {
      this.getSubSet(SubSet).set(item.id, item);
    });
  }

  /**
    * extend _super.doDelete_ to add SubSet porcessing
    * @override
    */
  protected override doDelete(id: K): any {
    const item = this.get(id);
    if (item) {
      item.memberOf.forEach((_: any, SubSetId: M) => (this._subsets.get(SubSetId) as Map<K, V>).delete(id));
    }
    return super.doDelete(id);
  }

  /**
   * Empties the SubSet, deleting all items from the SubSet.
   * 
   * Items that are no longer member of another Subset will also be deleted from the SuperSet
   */
  private emptySubSet(SubSetId: M): void {
    const SubSet = this.getSubSet(SubSetId);
    SubSet.forEach(item => {
      item.memberOf.delete(SubSetId);
      this.add(item);
    });
    SubSet.clear();
  }

  /**
   * Deletes the items in the SubSet from the SuperSet
   */
  deleteSubSetItems(SubSetId: M): void {
    const SubSet = this.getSubSet(SubSetId);
    SubSet.forEach(item => {
      this.doDelete(item.id);
    });
    SubSet.clear();
  }

  /**
   * Deletes the SubSet:
   * - Empties the SubSet
   * - Deletes the SubSet from the SuperSet
   */
  private deleteSubSet(SubSetId: M): void {
    this.emptySubSet(SubSetId);
    this._subsets.delete(SubSetId);
  }
}
