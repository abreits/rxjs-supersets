/* eslint-disable @typescript-eslint/no-unused-vars */
import { Subscription } from 'rxjs';

import { processDelta } from '../process-delta/process-delta';
import { MemberObject, DeltaObservable, MapDelta } from '../types';

import { SuperSet } from './super-set';

// debugging support function
// function printSubSet(SubSet: any) {
//   console.log('added:', [...SubSet.added.keys()])
//   console.log('deleted:', [...SubSet.deleted.keys()])
//   console.log('modified:', [...SubSet.modified.keys()])
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

describe('SuperSet', () => {
  let test: SuperSet<MemberObject>;
  let subscriptionResults: string[];
  let subscriptions: Subscription[];

  function subscribeHandlers(observable: DeltaObservable<string, MemberObject>, results: string[]): void {
    subscriptions.push(
      observable.pipe(processDelta({
        add: (entry: any) => results.push(`add:${entry.id}`),
        delete: (entry: any) => results.push(`delete:${entry.id}`),
        modify: (entry: any) => results.push(`modify:${entry.id}`)
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

  describe('constructor', () => {
    it('should create with the various subsets settings', () => {
      const test1 = new SuperSet();
      // quick test if the protected SubSet settings are correctly set ()
      expect((test1 as any).isModifiedSubSet).not.toBeDefined();
      expect((test1 as any).publishEmptySubSet).toEqual(true);

      const test2 = new SuperSet({ subsets: { isModified: () => true, publishEmpty: false } });
      // quick test if the protected SubSet settings are correctly set ()
      expect((test2 as any).isModifiedSubSet).toBeDefined();
      expect((test2 as any).publishEmptySubSet).toEqual(false);

      const test3 = new SuperSet({ subsets: { publishEmpty: true } });
      // quick test if the protected SubSet settings are correctly set ()
      expect((test3 as any).isModifiedSubSet).not.toBeDefined();
      expect((test3 as any).publishEmptySubSet).toEqual(true);

      const test4 = new SuperSet({ publishEmpty: true });
      // quick test if the protected SubSet settings are correctly set ()
      expect((test4 as any).isModifiedSubSet).not.toBeDefined();
      expect((test4 as any).publishEmptySubSet).toEqual(true);
    });
  });

  describe('subsets', () => {
    it('should return a list of existing subsets', () => {
      test = new SuperSet();
      const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
      test.add(testContent);
      const testContent2 = createContent({ id: 'content1', memberOf: ['SubSet2'] });
      test.add(testContent2);

      expect(test.subsets.size).toEqual(2);
    });
  });

  describe('add', () => {
    it('should merge subsets with existing entry, when inheritSubsets=true', () => {
      test = new SuperSet();
      const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
      test.add(testContent);
      const testContent2 = createContent({ id: 'content0', memberOf: ['SubSet2'] });
      test.add(testContent2, true);

      expect(test.get('content0')?.memberOf.has('SubSet1')).toBeTrue();
      expect(test.get('content0')?.memberOf.has('SubSet2')).toBeTrue();
    });

    it('should ignore nonexisting entry, when inheritSubsets=true', () => {
      test = new SuperSet();
      const testContent2 = createContent({ id: 'content0', memberOf: ['SubSet2'] });
      test.add(testContent2, true);

      expect(test.get('content0')?.memberOf.has('SubSet1')).toBeFalse();
      expect(test.get('content0')?.memberOf.has('SubSet2')).toBeTrue();
    });

    it('should delete an entry with no subsets', () => {
      test = new SuperSet();
      const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
      test.add(testContent);
      const testContent2 = createContent({ id: 'content0', memberOf: [] });
      test.add(testContent2);

      expect(test.get('content0')).not.toBeDefined();
      expect(test.subsets.get('SubSet1').has('content0')).toBeFalse();
    });

    it('should remove an entry from subsets it no longer belongs to', () => {
      test = new SuperSet();
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
      test = new SuperSet();
      test.add(item1);
      test.add(item2);
      test.add(item3);
    });

    it('should let get(subsetId) return a new subset when it does not already exist', () => {
      test = new SuperSet();
      const newSubSet = test.subsets.get('SubSet1');
      expect(newSubSet).toBeDefined();
    });

    it('should let get(subsetId) return an existing subset when it already exists', () => {
      test = new SuperSet();
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

    it('should let empty(subsetId) clear the SubSet and remove items with no subset', () => {
      test = new SuperSet();
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

    it('should let delete(subsetId) delete the SubSet from from the SuperSet', () => {
      test = new SuperSet();
      const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
      test.add(testContent);
      const testContent2 = createContent({ id: 'content1', memberOf: ['SubSet1', 'SubSet2'] });
      test.add(testContent2);

      const subscription = test.subsets.get('SubSet1').delta$.subscribe();

      test.subsets.delete('SubSet1');

      expect(test.get('content0')).not.toBeDefined();
      expect(test.get('content1')).toBeDefined();
      expect(test.get('content1')?.memberOf.size).toEqual(1);
      expect(test.get('content1')?.memberOf.has('SubSet1')).toBeFalse();
      expect(test.get('content1')?.memberOf.has('SubSet2')).toBeTrue();

      expect(subscription.closed).toBeTrue();
      expect(test.has('SubSet1')).toBeFalse();

      subscription.unsubscribe();
    });
  });

  describe('deleteSubSetItems', () => {
    it('should remove all items of the SubSet from the set', () => {
      test = new SuperSet();
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

  describe('SubSet delta$', () => {
    let SubSet1Results: string[];
    let SubSet2Results: string[];
    let SubSet1delta$Updates: MapDelta<string, MemberObject>[];
    let SubSet2delta$Updates: MapDelta<string, MemberObject>[];

    beforeEach(() => {
      SubSet1Results = [];
      SubSet2Results = [];
      SubSet1delta$Updates = [];
      SubSet2delta$Updates = [];

      test = new SuperSet();
      const SubSet1$ = test.subsets.get('SubSet1').delta$;
      const SubSet2$ = test.subsets.get('SubSet2').delta$;

      subscribeHandlers(test.delta$, subscriptionResults);
      subscribeHandlers(SubSet1$, SubSet1Results);
      subscribeHandlers(SubSet2$, SubSet2Results);

      subscriptions.push(
        SubSet1$.subscribe(update => SubSet1delta$Updates.push(update)),
        SubSet2$.subscribe(update => SubSet2delta$Updates.push(update)),
      );
    });

    describe('addMultiple', () => {
      it('should only publish a single update to the involved subsets', () => {
        const testContent = [
          createContent({ id: 'content0', memberOf: ['SubSet1'] }),
          createContent({ id: 'content1', memberOf: ['SubSet1'] }),
          createContent({ id: 'content2', memberOf: ['SubSet1', 'SubSet2'] }),
          createContent({ id: 'content3', memberOf: ['SubSet1', 'SubSet2'] }),
        ];

        test.addMultiple(testContent);

        expect(test.size).toEqual(4);
        expect(SubSet1delta$Updates.length).toEqual(1);
        expect(SubSet1delta$Updates[0].added.size).toEqual(4);
        expect(SubSet2delta$Updates.length).toEqual(1);
        expect(SubSet2delta$Updates[0].added.size).toEqual(2);
      });
    });

    describe('pause subset updates and resume subset updates', () => {
      it('should combine subset updates while they are paused', () => {
        test.subsets.pauseDeltas();
        const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
        test.add(testContent);

        expect(SubSet1Results).toEqual([]);
        expect(SubSet2Results).toEqual([]);
        expect(subscriptionResults).toEqual([`add:${testContent.id}`]);

        clear(subscriptionResults);

        const testContent2 = createContent({ id: 'content0', memberOf: ['SubSet2'] });
        const testContent3 = createContent({ id: 'content1', memberOf: ['SubSet2'] });
        test.add(testContent2);
        test.add(testContent3);
        test.delete(testContent3.id);
        test.delete(testContent3.id);

        test.subsets.resumeDeltas();

        expect(SubSet1delta$Updates.length).toEqual(1);
        expect(SubSet1Results).toEqual([]);
        expect(SubSet2delta$Updates.length).toEqual(1);
        expect(SubSet2Results).toEqual(['add:content0']);

        expect(subscriptionResults).toEqual([
          'modify:content0',
          'add:content1',
          'delete:content1'
        ]);
        // Javascript/Typescript/Jasmine/Karma bug? If the above code is replaced with:
        //
        // expect(subscriptionResults).toEqual([
        //   `modify:${testContent.id}`,
        //   `add:${testContent2.id}`,
        //   `delete:${testContent3.id}`
        // ]);
        //
        // or
        //
        // expect(subscriptionResults).toEqual([
        //   'modify:' + testContent.id,
        //   'add:' + testContent2.id,
        //   'delete:' + testContent3.id
        // ]);
        //
        // it results in a in a failing:
        //
        // expect(SubSet2Results).toEqual(['add:content0']);
        //
        // SubSet2Results is strangely transformed to: ['add:content1']
      });

      it('should ignore multiple pauseSubSetUpdates', () => {
        test.pauseSubsetDeltas();
        const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
        test.add(testContent);

        expect(SubSet1Results).toEqual([]);
        expect(SubSet2Results).toEqual([]);
        expect(subscriptionResults).toEqual([`add:${testContent.id}`]);

        // already paused
        test.pauseSubsetDeltas();

        clear(subscriptionResults);

        const testContent2 = createContent({ id: 'content0', memberOf: ['SubSet2'] });
        test.add(testContent2);

        test.resumeSubsetDeltas();

        expect(SubSet1Results).toEqual([]);
        expect(SubSet2Results).toEqual([`add:${testContent.id}`]);
        expect(subscriptionResults).toEqual([`modify:${testContent.id}`]);
      });

      it('should only publish an addMultiple update after resumeSubSetUpdates', () => {
        const testContent = [
          createContent({ id: 'content0', memberOf: ['SubSet1'] }),
          createContent({ id: 'content1', memberOf: ['SubSet1'] }),
          createContent({ id: 'content2', memberOf: ['SubSet1', 'SubSet2'] }),
          createContent({ id: 'content3', memberOf: ['SubSet1', 'SubSet2'] }),
        ];

        test.pauseSubsetDeltas();

        test.addMultiple(testContent);
        expect(test.size).toEqual(4);

        expect(SubSet1delta$Updates.length).toEqual(0);
        expect(SubSet2delta$Updates.length).toEqual(0);

        test.resumeSubsetDeltas();

        expect(SubSet1delta$Updates.length).toEqual(1);
        expect(SubSet1delta$Updates[0].added.size).toEqual(4);
        expect(SubSet2delta$Updates.length).toEqual(1);
        expect(SubSet2delta$Updates[0].added.size).toEqual(2);
      });

      it('should only publish a replace update after resumeSubSetUpdates', () => {
        const startContent = [
          createContent({ id: 'content0', memberOf: ['SubSet1'] }),
          createContent({ id: 'content1', memberOf: ['SubSet1'] }),
          createContent({ id: 'content2', memberOf: ['SubSet1', 'SubSet2'] }),
          createContent({ id: 'content3', memberOf: ['SubSet1', 'SubSet2'] }),
        ];

        const replaceContent = [
          createContent({ id: 'content5', memberOf: ['SubSet0'] }),
          createContent({ id: 'content1', memberOf: ['SubSet1'] }),
          createContent({ id: 'content2', memberOf: ['SubSet1', 'SubSet2'] }),
          createContent({ id: 'content3', memberOf: ['SubSet1', 'SubSet2'] }),
        ];

        test.addMultiple(startContent);
        clear(subscriptionResults);
        clear(SubSet1Results);
        clear(SubSet1delta$Updates);
        clear(SubSet2Results);
        clear(SubSet2delta$Updates);

        test.pauseSubsetDeltas();

        test.replace(replaceContent);
        expect(test.size).toEqual(4);

        expect(SubSet1delta$Updates.length).toEqual(0);
        expect(SubSet2delta$Updates.length).toEqual(0);

        test.resumeSubsetDeltas();

        expect(test.size).toEqual(4);
        expect(SubSet1delta$Updates.length).toEqual(1);
        expect(SubSet1delta$Updates[0].added.size).toEqual(0);
        expect(SubSet1delta$Updates[0].deleted.size).toEqual(1);
        expect(SubSet1delta$Updates[0].modified.size).toEqual(3);
        expect(SubSet2delta$Updates.length).toEqual(1);
        expect(SubSet2delta$Updates[0].added.size).toEqual(0);
        expect(SubSet2delta$Updates[0].deleted.size).toEqual(0);
        expect(SubSet2delta$Updates[0].modified.size).toEqual(2);
      });
    });

    describe('without isModified functions', () => {
      it('should publish SubSet add', () => {
        const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
        test.add(testContent);

        expect(SubSet1Results).toEqual([`add:${testContent.id}`]);
        expect(subscriptionResults).toEqual([`add:${testContent.id}`]);
      });

      it('should publish SubSet change', () => {
        const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
        test.add(testContent);

        expect(SubSet1Results).toEqual([`add:${testContent.id}`]);
        expect(SubSet2Results).toEqual([]);
        expect(subscriptionResults).toEqual([`add:${testContent.id}`]);

        clear(SubSet1Results);
        clear(SubSet2Results);
        clear(subscriptionResults);

        const testContent2 = createContent({ id: 'content0', memberOf: ['SubSet2'] });
        test.add(testContent2);

        expect(SubSet1Results).toEqual([`delete:${testContent.id}`]);
        expect(SubSet2Results).toEqual([`add:${testContent.id}`]);
        expect(subscriptionResults).toEqual([`modify:${testContent.id}`]);
      });

      it('should publish SubSet merge', () => {
        const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
        test.add(testContent);

        expect(SubSet1Results).toEqual([`add:${testContent.id}`]);
        expect(SubSet2Results).toEqual([]);
        expect(subscriptionResults).toEqual([`add:${testContent.id}`]);

        clear(SubSet1Results);
        clear(SubSet2Results);
        clear(subscriptionResults);

        const testContent2 = createContent({ id: 'content0', memberOf: ['SubSet2'] });
        test.add(testContent2, true);

        expect(SubSet1Results).toEqual([`modify:${testContent.id}`]);
        expect(SubSet2Results).toEqual([`add:${testContent.id}`]);
        expect(subscriptionResults).toEqual([`modify:${testContent.id}`]);
      });

      it('should publish SubSet addition', () => {
        const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
        test.add(testContent);

        expect(SubSet1Results).toEqual([`add:${testContent.id}`]);
        expect(SubSet2Results).toEqual([]);
        expect(subscriptionResults).toEqual([`add:${testContent.id}`]);

        clear(SubSet1Results);
        clear(SubSet2Results);
        clear(subscriptionResults);

        const testContent2 = createContent({ id: 'content0', memberOf: ['SubSet1', 'SubSet2'] });
        test.add(testContent2);

        expect(SubSet1Results).toEqual([`modify:${testContent.id}`]);
        expect(SubSet2Results).toEqual([`add:${testContent.id}`]);
        expect(subscriptionResults).toEqual([`modify:${testContent.id}`]);
      });
    });

    describe('with isModified functions', () => {
      beforeEach(() => {
        // all main modify's are defined as different
        const isModified = (a: MemberObject, b: MemberObject) => true;
        // all SubSet modify's are defined as equal
        const isModifiedInSubSet = (a: MemberObject, b: MemberObject) => false;
        test = new SuperSet({ isModified, subsets: { isModified: isModifiedInSubSet } });
        subscribeHandlers(test.delta$, subscriptionResults);
        SubSet1Results = [];
        subscribeHandlers(test.subsets.get('SubSet1').delta$, SubSet1Results);
        SubSet2Results = [];
        subscribeHandlers(test.subsets.get('SubSet2').delta$, SubSet2Results);
      });

      it('should publish SubSet add', () => {
        const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
        test.add(testContent);

        expect(SubSet1Results).toEqual([`add:${testContent.id}`]);
        expect(subscriptionResults).toEqual([`add:${testContent.id}`]);
      });

      it('should publish SubSet change', () => {
        const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
        test.add(testContent);

        expect(SubSet1Results).toEqual([`add:${testContent.id}`]);
        expect(SubSet2Results).toEqual([]);
        expect(subscriptionResults).toEqual([`add:${testContent.id}`]);

        clear(SubSet1Results);
        clear(SubSet2Results);
        clear(subscriptionResults);

        const testContent2 = createContent({ id: 'content0', memberOf: ['SubSet2'] });
        test.add(testContent2);

        expect(SubSet1Results).toEqual([`delete:${testContent.id}`]);
        expect(SubSet2Results).toEqual([`add:${testContent.id}`]);
        expect(subscriptionResults).toEqual([`modify:${testContent.id}`]);
      });

      it('should publish SubSet merge', () => {
        const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
        test.add(testContent);

        expect(SubSet1Results).toEqual([`add:${testContent.id}`]);
        expect(SubSet2Results).toEqual([]);
        expect(subscriptionResults).toEqual([`add:${testContent.id}`]);

        clear(SubSet1Results);
        clear(SubSet2Results);
        clear(subscriptionResults);

        const testContent2 = createContent({ id: 'content0', memberOf: ['SubSet2'] });
        test.add(testContent2, true);

        expect(SubSet1Results).toEqual([]);
        expect(SubSet2Results).toEqual([`add:${testContent.id}`]);
        expect(subscriptionResults).toEqual([`modify:${testContent.id}`]);
      });

      it('should publish SubSet addition', () => {
        const testContent = createContent({ id: 'content0', memberOf: ['SubSet1'] });
        test.add(testContent);

        expect(SubSet1Results).toEqual([`add:${testContent.id}`]);
        expect(SubSet2Results).toEqual([]);
        expect(subscriptionResults).toEqual([`add:${testContent.id}`]);

        clear(SubSet1Results);
        clear(SubSet2Results);
        clear(subscriptionResults);

        const testContent2 = createContent({ id: 'content0', memberOf: ['SubSet1', 'SubSet2'] });
        test.add(testContent2);

        expect(SubSet1Results).toEqual([]);
        expect(SubSet2Results).toEqual([`add:${testContent.id}`]);
        expect(subscriptionResults).toEqual([`modify:${testContent.id}`]);
      });
    });
  });
});
