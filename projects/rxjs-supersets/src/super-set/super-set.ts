import { DeltaSet } from '../delta-set/delta-set';
import { SimpleSuperSet } from '../simple-super-set/simple-super-set';
import { IsModified, MemberObject, ReadonlyDeltaMap, SubsetMap, SuperSetSettings } from '../types';

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
export class SuperSet<V extends MemberObject<K, M>, K = string, M = string> extends SimpleSuperSet<V, K, M> {
  protected override _subsets = new Map<M, DeltaSet<V, K>>();
  private publishSubSetUpdates = true;

  protected isModifiedSubSet?: IsModified<V>;
  protected publishEmptySubSet!: boolean;

  /**
   * The subsetMap, containing all subset specific methods and properties
   * 
   */
  override readonly subsets: SubsetMap<M, ReadonlyDeltaMap<K, V>> = {
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
   * @returns subset for the specified id, if it does not exist, it creates a new subset
   */
  protected override getSubSet(subsetId: M): DeltaSet<V, K> {
    let subset = this._subsets.get(subsetId);
    if (!subset) {
      subset = new DeltaSet<V, K>({ isModified: this.isModifiedSubSet, publishEmpty: this.publishEmptySubSet });
      this._subsets.set(subsetId, subset);
      if (!this.publishSubSetUpdates) {
        subset.pauseDelta();
      }
    }
    return subset;
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
   * pause all subset delta$ updates
   * 
   */
  private pauseSubsetDeltas(): void {
    this.doPauseSubsetDeltas();
    this.publishSubSetUpdates = false;
  }

  private doPauseSubsetDeltas(): void {
    if (this.publishSubSetUpdates) { // only pause when not already paused
      this._subsets.forEach(subset => subset.pauseDelta());
    }
  }

  /**
   * resume all subset delta$ updates
   * 
   */
  private resumeSubsetDeltas(): void {
    this.publishSubSetUpdates = true;
    this.doResumeSubsetDeltas();
  }

  private doResumeSubsetDeltas(): void {
    if (this.publishSubSetUpdates) { // only resume when not publicly paused
      this._subsets.forEach(subset => subset.resumeDelta());
    }
  }

  /**
   * Adds or modifies multiple MemberObject entries at once and notifies changes through _delta$_.
   * Also notifies the observed subsets that are involved. 
   * 
   * If an existing entry is the same according to the _isEqual_ function, nothing is changed.
   */
  override addMultiple(entries: Iterable<V>, mergeExistingSubsets = false): void {
    this.doPauseSubsetDeltas();
    for (const entry of entries) {
      this.doAdd(entry, mergeExistingSubsets);
    }
    this.publishDelta();
    this.doResumeSubsetDeltas();
  }

  /**
    * extend _super.doDelete_ to add subset porcessing
    * @override
    */
  protected override doDelete(id: K): any {
    const entry = this.get(id);
    if (entry) {
      entry.memberOf.forEach((_: any, subsetId: M) => (this._subsets.get(subsetId) as DeltaSet<V, K>).delete(id));
    }
    return super.doDelete(id);
  }

  /**
   * Replaces all existing entries with new entries.
   * - Adds _newitems_ not existing in the current entries.
   * - Updates existing entries where _newitems_ have changed (_isEqual_ function).
   * - Deletes entries not existing in _newitems_.
   * 
   * Notifies all changes through _delta$_.
   * Also notifies all involved subset delta$ subscriptions. 
   * @override
   */
  override replace(entries: Iterable<V>): void {
    this.doPauseSubsetDeltas();
    super.replace(entries);
    this.doResumeSubsetDeltas();
  }

  /**
   * Deletes the entries in the subset from the SuperSet
   * and thereby also from all other subsets in the superset.
   */
  override deleteSubSetItems(subsetId: M): void {
    this.doPauseSubsetDeltas();
    const subset = this.getSubSet(subsetId);
    subset.forEach(entry => {
      this.doDelete(entry.id);
    });
    this.publishDelta();
    this.doResumeSubsetDeltas();
    subset.clear();
  }

  /**
   * Deletes the subset:
   * - Empties the subset
   * - Completes all its delta$ subscriptions.
   * - Deletes the subset from the SuperSet
   */
  protected override deleteSubSet(subsetId: M): void {
    this.emptySubSet(subsetId);
    this.getSubSet(subsetId).close();
    this._subsets.delete(subsetId);
  }
}
