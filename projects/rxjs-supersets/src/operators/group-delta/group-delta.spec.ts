import { Subscription } from 'rxjs';

import { DeltaSet } from '../../delta-set/delta-set';
import { GroupObject, IdObject, MapDelta } from '../../types';

import { groupDelta } from './group-delta';

interface TestIdObject extends IdObject {
  group: number;
  inGroup?: boolean;
}

class TestGroupObject implements GroupObject<TestIdObject, number> {
  public map = new Map<string, TestIdObject>();

  constructor(
    public id: number
  ) { }

  add(entry: TestIdObject) {
    this.map.set(entry.id, entry);
  }

  remove(entry: TestIdObject): boolean {
    this.map.delete(entry.id);
    return this.map.size > 0;
  }
}

function createGroupId(entry: TestIdObject): number {
  return entry.group;
}

function putInGroup(entry: TestIdObject): boolean {
  return entry.inGroup ?? true;
}

describe('groupDelta operator', () => {
  let deltaSet = new DeltaSet<TestIdObject>();
  let subscription: Subscription;
  let results: MapDelta<number, TestGroupObject>[];

  beforeEach(() => {
    results = [];
    deltaSet = new DeltaSet();
    subscription = deltaSet.delta$.pipe(
      groupDelta(TestGroupObject, createGroupId, putInGroup),
    ).subscribe(result => results.push(result));
  });

  afterEach(() => {
    subscription.unsubscribe();
  });

  it('should add an element to a group', () => {
    deltaSet.add({ id: '1', group: 1 });
    expect(results.length).toBe(1);
    expect(results[0].added.get(1)).toBeDefined();
  });

  it('should add multiple elements to a group', () => {
    deltaSet.add({ id: '1a', group: 1 });
    results = [];
    deltaSet.add({ id: '1b', group: 1 });

    // group added in the first update, element added in the second update
    const group1 = results[0].modified.get(1);
    expect(group1).toBeDefined();
    expect(group1?.map.size).toBe(2);
  });

  it('should update the same element the same group', () => {
    deltaSet.add({ id: '1', group: 1 });
    results = [];
    deltaSet.add({ id: '1', group: 1 });

    // group added in the first update, element modified in the second update
    const group1 = results[0].modified.get(1);
    expect(group1).toBeDefined();
    expect(group1?.map.size).toBe(1);
  });

  it('should add elements to multiple groups', () => {
    deltaSet.add({ id: '1', group: 1 });
    results = [];
    deltaSet.add({ id: '2', group: 2 });

    // group added in the first update, other group added in the second update
    const group1 = results[0].added.get(2);
    expect(group1).toBeDefined();
    expect(group1?.map.size).toBe(1);
  });

  it('should move an existing element to another group', () => {
    deltaSet.add({ id: '1a', group: 1 });
    deltaSet.add({ id: '1b', group: 1 });
    results = [];
    deltaSet.add({ id: '1b', group: 2 });

    // group added in the first update, 
    // element added to th group in the second update
    // element moved to other group in the third update
    const group1 = results[0].modified.get(1);
    expect(group1).toBeDefined();
    expect(group1?.map.size).toBe(1);
    const group2 = results[0].added.get(2);
    expect(group2).toBeDefined();
    expect(group2?.map.size).toBe(1);
  });

  it('should delete the group if it no longer contains elements', () => {
    deltaSet.add({ id: '1a', group: 1 });
    results = [];
    deltaSet.add({ id: '1a', group: 2 });

    // group added in the first update, 
    // element moved to other group in the second update
    const group1 = results[0].deleted.get(1);
    expect(group1).toBeDefined();
    expect(group1?.map.size).toBe(0);
    const group2 = results[0].added.get(2);
    expect(group2).toBeDefined();
    expect(group2?.map.size).toBe(1);
  });

  it('should only send process filtered elements', () => {
    deltaSet.add({ id: '1', group: 1, inGroup: true });
    expect(results.length).toBe(1);
    expect(results[0].added.get(1)).toBeDefined();
    results = [];
    deltaSet.add({ id: '2', group: 2, inGroup: false });
    expect(results.length).toBe(0);
  });
});
