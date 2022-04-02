import { DeltaSet } from '../delta-set/delta-set';
import { IsModified, MemberObject, ReadonlyDeltaMap, SubsetMap, SuperSetSettings } from '../types';

/**
 * A `DeltaSet` with `MemberObjects` that are member of 0 or more SubSets.
 * 
 * A `SubSet` is a `DeltaSet` containing all `MemberObjects` that are `memberOf` the `SubSet` 
 * (i.e. have the `SubSetId` in its `memberOf` property)
 * 
 * Allows you to automatically keep track of each subset content:
 * - Subscribe to subset `delta$` to get all changes
 * - If the item is not `memberOf` any subsets any more it will be deleted from the `SuperSet`
 */
export class SuperSet<V extends MemberObject<K, M>, K = string, M = string> extends DeltaSet<V, K> {
  protected _subsets = new Map<M, DeltaSet<V, K>>();
  private publishSubSetUpdates = true;

  protected isModifiedSubSet?: IsModified<V>;
  protected publishEmptySubSet!: boolean;

  /**
   * The subsetMap, containing all subset specific methods and properties
   * 
   */
  readonly subsets: SubsetMap<M, ReadonlyDeltaMap<K, V>> = {
    get: key => this.getSubSet(key),
    entries: () => this._subsets.entries(),
    forEach: fn => this._subsets.forEach(fn),
    has: key => this._subsets.has(key),
    keys: () => this._subsets.keys(),
    size: 0, // getter replaced in constructor
    values: () => this._subsets.values(),
    [Symbol.iterator]: () => this._subsets[Symbol.iterator](),
    empty: key => this.emptySubSet(key),
    delete: key => this.deleteSubSet(key),
    pauseDeltas: () => this.pauseSubsetDeltas(),
    resumeDeltas: () => this.resumeSubsetDeltas()
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
  private getSubSet(SubSetId: M): DeltaSet<V, K> {
    let SubSet = this._subsets.get(SubSetId);
    if (!SubSet) {
      SubSet = new DeltaSet<V, K>({ isModified: this.isModifiedSubSet, publishEmpty: this.publishEmptySubSet });
      this._subsets.set(SubSetId, SubSet);
      if (!this.publishSubSetUpdates) {
        SubSet.pauseDelta();
      }
    }
    return SubSet;
  }

  /**
   * Process constructor settings
   */
  protected override initializeSettings(settings: SuperSetSettings<V>): void {
    super.initializeSettings(settings);
    this.isModifiedSubSet = settings.subsets?.isModified;
    this.publishEmptySubSet = settings.subsets?.publishEmpty === undefined ? true : settings.subsets.publishEmpty;
  }

  /**
   * pause all SubSet delta$ updates
   * 
   * @deprecated, use `superSet.subset.pauseDeltas()` instead
   * 
   */
  public pauseSubsetDeltas(): void {
    this.doPauseSubsetDeltas();
    this.publishSubSetUpdates = false;
  }

  private doPauseSubsetDeltas(): void {
    if (this.publishSubSetUpdates) { // only pause when not already paused
      this._subsets.forEach(SubSet => SubSet.pauseDelta());
    }
  }

  /**
   * resume all SubSet delta$ updates
   * 
   * @deprecated, use `superSet.subset.resumeDeltas()` instead
   */
  resumeSubsetDeltas(): void {
    this.publishSubSetUpdates = true;
    this.doResumeSubsetDeltas();
  }

  private doResumeSubsetDeltas(): void {
    if (this.publishSubSetUpdates) { // only resume when not publicly paused
      this._subsets.forEach(SubSet => SubSet.resumeDelta());
    }
  }

  /**
   * Adds or modifies a MemberObject item, notifies changes through _delta$_.
   * Also notifies the observed subsets that are involved.
   * 
   * If an existing item is the same according to the _isEqual_ function, nothing is changed.
   * @override
   */
  override add(item: V, mergeExistingSubsets = false): SuperSet<V, K, M> {
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
    this.doPauseSubsetDeltas();
    for (const item of items) {
      this.doAdd(item, mergeExistingSubsets);
    }
    this.publishDelta();
    this.doResumeSubsetDeltas();
  }


  private updateSubsets(item: V, previtem: V | undefined) {
    const newCategories = item.memberOf;
    const oldCategories = previtem ? previtem.memberOf : new Set<M>();
    // remove item from subsets it is no longer member of
    oldCategories.forEach(SubSetId => {
      if (!newCategories.has(SubSetId)) {
        // delete the item from all subsets it is member of (subsets.get should always return a value here)
        (this._subsets.get(SubSetId) as DeltaSet<V, K>).delete(item.id);
      }
    });
    // add item to all new subsets
    newCategories.forEach(SubSet => {
      this.getSubSet(SubSet).add(item);
    });
  }

  /**
    * extend _super.doDelete_ to add SubSet porcessing
    * @override
    */
  protected override doDelete(id: K): any {
    const item = this.get(id);
    if (item) {
      item.memberOf.forEach((_: any, SubSetId: M) => (this._subsets.get(SubSetId) as DeltaSet<V, K>).delete(id));
    }
    return super.doDelete(id);
  }

  /**
   * Replaces all existing items with new items.
   * - Adds _newitems_ not existing in the current items.
   * - Updates existing items where _newitems_ have changed (_isEqual_ function).
   * - Deletes items not existing in _newitems_.
   * 
   * Notifies all changes through _delta$_.
   * Also notifies all involved SubSet delta$ subscriptions. 
   * @override
   */
  override replace(items: Iterable<V>): void {
    this.doPauseSubsetDeltas();
    super.replace(items);
    this.doResumeSubsetDeltas();
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
   * and thereby also from all other subsets in the superset.
   */
  deleteSubSetItems(SubSetId: M): void {
    this.doPauseSubsetDeltas();
    const SubSet = this.getSubSet(SubSetId);
    SubSet.forEach(item => {
      this.doDelete(item.id);
    });
    SubSet.clear();
    this.doResumeSubsetDeltas();
  }

  /**
   * Deletes the SubSet:
   * - Empties the SubSet
   * - Completes all its delta$ subscriptions.
   * - Deletes the SubSet from the SuperSet
   */
  private deleteSubSet(SubSetId: M): void {
    this.emptySubSet(SubSetId);
    this.getSubSet(SubSetId).destroy();
    this._subsets.delete(SubSetId);
  }
}
