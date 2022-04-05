/* eslint-disable @typescript-eslint/no-unused-vars */
import { Subscription } from 'rxjs';

import { processDelta } from '../process-delta/process-delta';
import { MemberObject, DeltaObservable } from '../types';

import { SimpleSuperSet } from './simple-super-set';

// debugging support function
// function printSubSet(subset: any) {
//   console.log('created:', [...subset.created.keys()])
//   console.log('deleted:', [...subset.deleted.keys()])
//   console.log('updated:', [...subset.updated.keys()])
// }

class ContentClass implements MemberObject {
  constructor(
    public id: string,
    public memberOf: Set<string>
  ) { }
}

function createContent(element: any): ContentClass {
  return new ContentClass(element.id, new Set(element.memberOf));
}

describe('SimpleSimpleSuperSet', () => {
  let test: SimpleSuperSet<MemberObject>;
  let subscriptionResults: string[];
  let subscriptions: Subscription[];

  function subscribeHandlers(observable: DeltaObservable<string, MemberObject>, results: string[]): void {
    subscriptions.push(
      observable.pipe(processDelta({
        create: (entry: any) => results.push(`add:${entry.id}`),
        delete: (entry: any) => results.push(`delete:${entry.id}`),
        update: (entry: any) => results.push(`modify:${entry.id}`)
      })).subscribe()
    );
  }

  function clear(array: any[]): void {
    array.length = 0;
  }

  beforeEach(() => {
    subscriptionResults = [];
    subscriptions = [];
  });

  afterEach(() => {
    subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
  });

  describe('subsets', () => {
    it('should return a list of existing subsets', () => {
      test = new SimpleSuperSet();
      const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
      test.add(testContent);
      const testContent2 = createContent({ id: 'content1', memberOf: ['SubSet2'] });
      test.add(testContent2);

      expect(test.subsets.size).toEqual(2);
    });
  });

  describe('add', () => {
    it('should merge subsets with existing entry, when inheritSubsets=true', () => {
      test = new SimpleSuperSet();
      const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
      test.add(testContent);
      const testContent2 = createContent({ id: 'content0', memberOf: ['SubSet2'] });
      test.add(testContent2, true);

      expect(test.get('content0')?.memberOf.has('SubSet1')).toBeTrue();
      expect(test.get('content0')?.memberOf.has('SubSet2')).toBeTrue();
    });

    it('should ignore nonexisting entry, when inheritSubsets=true', () => {
      test = new SimpleSuperSet();
      const testContent2 = createContent({ id: 'content0', memberOf: ['SubSet2'] });
      test.add(testContent2, true);

      expect(test.get('content0')?.memberOf.has('SubSet1')).toBeFalse();
      expect(test.get('content0')?.memberOf.has('SubSet2')).toBeTrue();
    });

    it('should delete an entry with no subsets', () => {
      test = new SimpleSuperSet();
      const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
      test.add(testContent);
      const testContent2 = createContent({ id: 'content0', memberOf: [] });
      test.add(testContent2);

      expect(test.get('content0')).not.toBeDefined();
      expect(test.subsets.get('SubSet1').has('content0')).toBeFalse();
    });

    it('should remove an entry from subsets it no longer belongs to', () => {
      test = new SimpleSuperSet();
      const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
      test.add(testContent);
      const testContent2 = createContent({ id: 'content0', memberOf: ['SubSet2'] });
      test.add(testContent2);

      expect(test.get('content0')).toBeDefined();
      expect(test.subsets.get('SubSet1').has('content0')).toBeFalse();
      expect(test.subsets.get('SubSet2').has('content0')).toBeTrue();
    });
  });

  describe('subsets', () => {
    let item1: ContentClass;
    let item2: ContentClass;
    let item3: ContentClass;

    beforeEach(() => {
      // initialize content 
      item1 = createContent({ id: 'item1', memberOf: ['SubSet1'] });
      item2 = createContent({ id: 'item2', memberOf: ['SubSet2'] });
      item3 = createContent({ id: 'item3', memberOf: ['SubSet1', 'SubSet2'] });
      test = new SimpleSuperSet();
      test.add(item1);
      test.add(item2);
      test.add(item3);
    });

    it('should let get(subsetId) return a new subset when it does not already exist', () => {
      test = new SimpleSuperSet();
      const newSubSet = test.subsets.get('SubSet1');
      expect(newSubSet).toBeDefined();
    });

    it('should let get(subsetId) return an existing subset when it already exists', () => {
      test = new SimpleSuperSet();
      const newSubSet = test.subsets.get('SubSet1');
      const existingSubSet = test.subsets.get('SubSet1');
      expect(existingSubSet).toBe(newSubSet);
    });

    it('should execute entries()', () => {
      expect([...test.subsets.entries()].length).toEqual(2);
    });

    it('should execute forEach(fn)', () => {
      const subsetIds: string[] = [];

      test.subsets.forEach((_, subsetId) => subsetIds.push(subsetId));

      expect(subsetIds.length).toEqual(2);
      expect(subsetIds).toContain('SubSet1');
      expect(subsetIds).toContain('SubSet2');
    });

    it('should let has(subsetId) return true if subsetId exists', () => {
      expect(test.subsets.has('SubSet1')).toBeTrue();
    });

    it('should let has(subsetId) return false if subsetId does not exist', () => {
      expect(test.subsets.has('SubSet3')).toBeFalse();
    });

    it('should execute keys()', () => {
      expect([...test.subsets.keys()].length).toEqual(2);
    });

    it('should return the correct size', () => {
      expect(test.subsets.size).toEqual(2);
    });

    it('should execute values()', () => {
      expect([...test.subsets.values()].length).toEqual(2);
    });

    it('should execute [Symbol.iterator]', () => {
      expect([...test.subsets].length).toEqual(2);
    });

    it('should let empty(subsetId) clear the subset and remove items with no subset', () => {
      test = new SimpleSuperSet();
      const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
      test.add(testContent);
      const testContent2 = createContent({ id: 'content1', memberOf: ['SubSet1', 'SubSet2'] });
      test.add(testContent2);

      test.subsets.empty('SubSet1');

      expect(test.get('content0')).not.toBeDefined();
      expect(test.get('content1')).toBeDefined();
      expect(test.get('content1')?.memberOf.size).toEqual(1);
      expect(test.get('content1')?.memberOf.has('SubSet1')).toBeFalse();
      expect(test.get('content1')?.memberOf.has('SubSet2')).toBeTrue();
    });

    it('should let delete(subsetId) delete the subset from from the SuperSet', () => {
      test = new SimpleSuperSet();
      const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
      test.add(testContent);
      const testContent2 = createContent({ id: 'content1', memberOf: ['SubSet1', 'SubSet2'] });
      test.add(testContent2);

      test.subsets.delete('SubSet1');

      expect(test.get('content0')).not.toBeDefined();
      expect(test.get('content1')).toBeDefined();
      expect(test.get('content1')?.memberOf.size).toEqual(1);
      expect(test.get('content1')?.memberOf.has('SubSet1')).toBeFalse();
      expect(test.get('content1')?.memberOf.has('SubSet2')).toBeTrue();

      expect(test.has('SubSet1')).toBeFalse();
    });
  });

  describe('deleteSubSetItems', () => {
    it('should remove all items of the subset from the set', () => {
      test = new SimpleSuperSet();
      const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
      test.add(testContent);
      const testContent2 = createContent({ id: 'content1', memberOf: ['SubSet1', 'SubSet2'] });
      test.add(testContent2);
      const testContent3 = createContent({ id: 'content2', memberOf: ['SubSet2'] });
      test.add(testContent3);

      test.deleteSubSetItems('SubSet1');

      expect(test.get('content0')).not.toBeDefined();
      expect(test.get('content1')).not.toBeDefined();
      expect(test.get('content2')).toBeDefined();
    });
  });

  describe('addMultiple', () => {
    it('should add multiple ', () => {
      test = new SimpleSuperSet();
      const testContent = [
        createContent({ id: 'content0', memberOf: ['SubSet1'] }),
        createContent({ id: 'content1', memberOf: ['SubSet1'] }),
        createContent({ id: 'content2', memberOf: ['SubSet1', 'SubSet2'] }),
        createContent({ id: 'content3', memberOf: ['SubSet1', 'SubSet2'] }),
      ];

      test.addMultiple(testContent);

      expect(test.size).toEqual(4);
    });
  });
});
