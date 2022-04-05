import { Subscription } from 'rxjs';

import { processDelta } from '../process-delta/process-delta';
import { IdObject, MapDelta } from '../types';

import { DeltaMap } from './delta-map';


interface ContentIdObject extends IdObject {
  content: string;
}

describe('DeltaMap', () => {
  const entry1 = { id: 'entry1' };
  const entry2 = { id: 'entry2' };
  const entry2a = { id: 'entry2', content: 'a' };
  const entry2b = { id: 'entry2', content: 'b' };
  const entry2a2 = { id: 'entry2', content: 'a' };
  const entry3 = { id: 'entry3' };
  const entry4 = { id: 'entry4' };

  describe('constructor', () => {
    it('should create a new ObservableMap without arguments', () => {

      const test = new DeltaMap();

      expect(test).toBeDefined();
      expect(test.size).toEqual(0);
    });

    it('should create a new ObservableMap from an array', () => {
      const predefined = [
        ['entry1', 'content1'],
        ['entry2', 'content2'],
        ['entry3', 'content3']
      ];

      const test = new DeltaMap(predefined);

      expect(test).toBeDefined();
      expect(test.size).toEqual(3);
      expect(test.get('entry2')).toEqual('content2');
    });

    it('should create a new ObservableMap from a Map', () => {
      const predefinedMap = new Map([
        ['entry1', 'content1'],
        ['entry2', 'content2'],
        ['entry3', 'content3']
      ]);

      const test = new DeltaMap(predefinedMap);

      expect(test).toBeDefined();
      expect(test.size).toEqual(3);
      expect(test.get('entry2')).toEqual('content2');
    });

    it('should create a new ObservableMap with an isModified function in the settings', () => {
      const isModifiedFunction = (a: ContentIdObject, b: ContentIdObject) => a.content !== b.content;

      const test = new DeltaMap<string, ContentIdObject>({ isModified: isModifiedFunction });

      test.set(entry2a.id, entry2a);
      test.set(entry2a2.id, entry2a2);

      expect(test.get(entry2.id)).toBe(entry2a);
    });

    it('should create a new ObservableMap with an isModified function in the settings', () => {
      const isModifiedFunction = (a: ContentIdObject, b: ContentIdObject) => a.content !== b.content;

      const test = new DeltaMap<string, ContentIdObject>({ isModified: isModifiedFunction });

      test.set(entry2a.id, entry2a);
      test.set(entry2a2.id, entry2a2);

      expect(test.get(entry2.id)).toBe(entry2a);
    });

    it('should create a new ObservableMap with both predefined entries and settings', () => {
      const predefinedArray = [
        [entry1.id, entry1],
        [entry3.id, entry3]
      ];
      const isModifiedFunction = (a: ContentIdObject, b: ContentIdObject) => a.content !== b.content;

      const test = new DeltaMap<string, ContentIdObject>(predefinedArray, { isModified: isModifiedFunction });

      test.set(entry2a.id, entry2a);
      test.set(entry2a2.id, entry2a2);

      expect(test.get(entry2.id)).toBe(entry2a);
      expect(test.get(entry3.id)).toEqual(entry3 as any);
    });
  });

  describe('isObserved', () => {
    it('should only return true if no subscription is active', () => {
      const test = new DeltaMap();

      // no subscription
      expect(test.observed).toBeFalse();

      // delta$ subscription
      const subscription = test.delta$.subscribe();
      expect(test.observed).toBeTrue();
      subscription.unsubscribe();
      expect(test.observed).toBeFalse();

      // cleanup
      subscription.unsubscribe();
    });
  });

  describe('set', () => {
    it('should add new entries', () => {
      const test = new DeltaMap();

      test.set(entry1.id, entry1);

      expect(test.get(entry1.id)).toBe(entry1);
    });

    it('should overwrite existing entries when no isModified function is defined', () => {
      const test = new DeltaMap();

      test.set(entry2.id, entry2);
      test.set(entry2a.id, entry2a);

      expect(test.get(entry2.id)).toBe(entry2a);
    });

    it('should overwrite existing entries when the isModified function returns true', () => {
      const isModifiedFunction = (a: ContentIdObject, b: ContentIdObject) => a.content !== b.content;
      const test = new DeltaMap<string, ContentIdObject>({ isModified: isModifiedFunction });

      test.set(entry2a.id, entry2a);
      test.set(entry2b.id, entry2b);

      expect(test.get(entry2.id)).toBe(entry2b);
    });

    it('should not overwrite existing entries when the ismodified function returns false', () => {
      const isModifiedFunction = (a: ContentIdObject, b: ContentIdObject) => a.content !== b.content;
      const test = new DeltaMap<string, ContentIdObject>({ isModified: isModifiedFunction });

      test.set(entry2a.id, entry2a);
      test.set(entry2a2.id, entry2a2);

      expect(test.get(entry2.id)).toBe(entry2a);
    });
  });

  describe('delete', () => {
    it('should delete an existing entry', () => {
      const test = new DeltaMap();

      test.set(entry1.id, entry1);
      test.set(entry2.id, entry2);
      test.set(entry3.id, entry3);

      expect(test.delete(entry2.id)).toBeTrue();

      expect(test.size).toEqual(2);
      expect(test.get(entry1.id)).toBeDefined();
      expect(test.get(entry2.id)).not.toBeDefined();
      expect(test.get(entry3.id)).toBeDefined();
    });

    it('should ignore a nonexisting entry', () => {
      const test = new DeltaMap();

      test.set(entry1.id, entry1);
      test.set(entry2.id, entry2);
      test.set(entry3.id, entry3);

      expect(test.delete(entry4.id)).toBeFalse();

      expect(test.size).toEqual(3);
      expect(test.get(entry1.id)).toBeDefined();
      expect(test.get(entry2.id)).toBeDefined();
      expect(test.get(entry3.id)).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should remove all existing entries', () => {
      const test = new DeltaMap();

      test.set(entry1.id, entry1);
      test.set(entry2.id, entry2);
      test.set(entry3.id, entry3);

      test.clear();

      expect(test.size).toEqual(0);
    });
  });

  describe('delta$ subscription', () => {
    let subscriptionResults: string[];
    let subscriptions: Subscription[];
    let delta$Results: MapDelta<string, any>[];

    function subscribeHandlers(map: DeltaMap<string, IdObject>): void {
      subscriptions.push(
        map.delta$.pipe(processDelta({
          add: (entry) => subscriptionResults.push(`add:${entry.id}`),
          delete: (entry) => subscriptionResults.push(`delete:${entry.id}`),
          modify: (entry) => subscriptionResults.push(`modify:${entry.id}`)
        })).subscribe(result => delta$Results.push(result))
      );
    }

    beforeEach(() => {
      subscriptionResults = [];
      delta$Results = [];
      subscriptions = [];
    });

    afterEach(() => {
      subscriptions.forEach(subscription => {
        subscription.unsubscribe();
      });
    });

    describe('constructor', () => {
      it('should publish items defined in the constructor', () => {
        const predefined = [
          [entry1.id, entry1],
          [entry2.id, entry2],
          [entry3.id, entry3]
        ];

        const test = new DeltaMap<string, any>(predefined);
        subscribeHandlers(test);

        expect(subscriptionResults.length).toEqual(3);
        expect(subscriptionResults).toEqual([
          `add:${entry1.id}`,
          `add:${entry2.id}`,
          `add:${entry3.id}`
        ]);
      });
    });

    describe('pauseDelta & resumeDelta', () => {
      it('should send individual delta$ updates before pauseDelta is called', () => {
        const test = new DeltaMap<string, any>();
        subscribeHandlers(test);

        test.set(entry1.id, entry1);
        test.set(entry2.id, entry2);

        expect(test.get(entry1.id)).toBe(entry1);
        expect(test.get(entry2.id)).toBe(entry2);

        // expected observe results:
        expect(delta$Results.length).toEqual(2); // 2 sets
        expect(subscriptionResults).toEqual([`add:${entry1.id}`, `add:${entry2.id}`]);
      });

      it('should not send delta$ updates after pauseDelta is called', () => {
        const test = new DeltaMap<string, any>();
        subscribeHandlers(test);

        test.pauseDelta();
        test.set(entry1.id, entry1);
        test.set(entry2.id, entry2);

        expect(test.get(entry1.id)).toBe(entry1);
        expect(test.get(entry2.id)).toBe(entry2);

        // expected observe results:
        expect(delta$Results.length).toEqual(0); // pause not resumed
        expect(subscriptionResults).toEqual([]);
      });

      it('should send combined delta$ updates after resumeDelta is called', () => {
        const test = new DeltaMap<string, any>();
        subscribeHandlers(test);

        test.pauseDelta();
        test.set(entry1.id, entry1);
        test.set(entry2.id, entry2);
        test.resumeDelta();

        expect(test.get(entry1.id)).toBe(entry1);
        expect(test.get(entry2.id)).toBe(entry2);

        // expected observe results:
        expect(delta$Results.length).toEqual(1); // result combined into 1 update
        expect(subscriptionResults).toEqual([`add:${entry1.id}`, `add:${entry2.id}`]);
      });

      it('should not send a delta$ update if a new set element is deleted before resumeDelta', () => {
        const test = new DeltaMap<string, any>();
        subscribeHandlers(test);

        // trigger the always send first update
        test.delete(entry1.id);
        expect(delta$Results.length).toEqual(1);
        test.pauseDelta();
        test.set(entry1.id, entry1);
        test.delete(entry1.id);
        test.resumeDelta();

        // expected observe results:
        expect(delta$Results.length).toEqual(1); // no change
        expect(subscriptionResults).toEqual([]);
      });

      it('should send only one delta$.add update if a new set element is modified before resumeDelta', () => {
        const test = new DeltaMap<string, any>();
        subscribeHandlers(test);

        test.pauseDelta();
        test.set(entry2.id, entry2);
        test.set(entry2a.id, entry2a);
        test.resumeDelta();

        // expected observe results:
        expect(delta$Results.length).toEqual(1); // result combined into 1 update
        expect(subscriptionResults).toEqual([`add:${entry2a.id}`]);
      });

      it('should not send a delta$.modify update if an existing element is modified and deleted before resumeDelta', () => {
        const test = new DeltaMap<string, any>();
        subscribeHandlers(test);

        test.set(entry2.id, entry2);
        subscriptionResults = [];
        delta$Results = [];

        test.pauseDelta();
        test.set(entry2a.id, entry2a);
        test.delete(entry2.id);
        test.resumeDelta();

        // expected observe results:
        expect(delta$Results.length).toEqual(1); // result combined into 1 update
        expect(subscriptionResults).toEqual([`delete:${entry2.id}`]);
      });

      it('should only send a delta$.add update if an new element is set, deleted and set again before resumeDelta', () => {
        const test = new DeltaMap<string, any>();
        subscribeHandlers(test);

        subscriptionResults = [];
        delta$Results = [];

        test.pauseDelta();
        test.set(entry2.id, entry2);
        test.delete(entry2.id);
        test.set(entry2a.id, entry2a);
        test.resumeDelta();

        // expected observe results:
        expect(delta$Results.length).toEqual(1); // result combined into 1 update
        expect(subscriptionResults).toEqual([`add:${entry2.id}`]);
      });

      it('should only send a delta$.modify update if an existing element is deleted and set before resumeDelta', () => {
        const test = new DeltaMap<string, any>();
        subscribeHandlers(test);

        test.set(entry2.id, entry2);
        subscriptionResults = [];
        delta$Results = [];

        test.pauseDelta();
        test.delete(entry2.id);
        test.set(entry2a.id, entry2a);
        test.resumeDelta();

        // expected observe results:
        expect(delta$Results.length).toEqual(1); // result combined into 1 update
        expect(subscriptionResults).toEqual([`modify:${entry2.id}`]);
      });
    });

    describe('set', () => {
      it('should add new entries', () => {
        const test = new DeltaMap<string, any>();
        subscribeHandlers(test);

        test.set(entry1.id, entry1);

        expect(test.get(entry1.id)).toBe(entry1);

        // expected observe results:
        expect(subscriptionResults).toEqual([`add:${entry1.id}`]);
      });

      it('should overwrite existing entries when no isModified function is defined', () => {
        const test = new DeltaMap<string, any>();
        subscribeHandlers(test);

        test.set(entry2.id, entry2);
        test.set(entry2a.id, entry2a);

        expect(test.get(entry2.id)).toBe(entry2a);

        // expected observe results:
        expect(subscriptionResults).toEqual([`add:${entry2.id}`, `modify:${entry2a.id}`]);
      });

      it('should overwrite existing entries when the isModified function returns true', () => {
        const isModifiedFunction = (a: ContentIdObject, b: ContentIdObject) => a.content !== b.content;
        const test = new DeltaMap<string, ContentIdObject>({ isModified: isModifiedFunction });
        subscribeHandlers(test as any); // typescript does not recognize type compatibility, bug?

        test.set(entry2a.id, entry2a);
        test.set(entry2b.id, entry2b);

        expect(test.get(entry2.id)).toBe(entry2b);

        // expected observe results:
        expect(subscriptionResults).toEqual([`add:${entry2a.id}`, `modify:${entry2b.id}`]);
      });

      it('should not overwrite existing entries when the isModified function returns false', () => {
        const isModifiedFunction = (a: ContentIdObject, b: ContentIdObject) => a.content !== b.content;
        const test = new DeltaMap<string, ContentIdObject>({ isModified: isModifiedFunction });
        subscribeHandlers(test as any); // typescript does not recognize type compatibility, bug?

        test.set(entry2a.id, entry2a);
        test.set(entry2a2.id, entry2a2);

        expect(test.get(entry2.id)).toBe(entry2a);

        // expected observe results:
        expect(subscriptionResults).toEqual([`add:${entry2a.id}`]);
      });

      it('should receive previously added entries', () => {
        const test = new DeltaMap<string, any>();

        test.set(entry1.id, entry1);
        test.set(entry2.id, entry2);

        subscribeHandlers(test);

        // expected observe results:
        expect(subscriptionResults).toEqual([`add:${entry1.id}`, `add:${entry2.id}`]);
      });
    });

    describe('delete', () => {
      it('should delete an existing entry', () => {
        const test = new DeltaMap<string, any>();
        subscribeHandlers(test);

        test.set(entry1.id, entry1);
        test.set(entry2.id, entry2);
        test.set(entry3.id, entry3);

        expect(test.delete(entry2.id)).toBeTrue();

        expect(test.size).toEqual(2);
        expect(test.get(entry1.id)).toBeDefined();
        expect(test.get(entry2.id)).not.toBeDefined();
        expect(test.get(entry3.id)).toBeDefined();

        // expected observe results:
        expect(subscriptionResults).toEqual([
          `add:${entry1.id}`,
          `add:${entry2.id}`,
          `add:${entry3.id}`,
          `delete:${entry2.id}`
        ]);
      });

      it('should ignore a nonexisting entry', () => {
        const test = new DeltaMap<string, any>();
        subscribeHandlers(test);

        test.set(entry1.id, entry1);
        test.set(entry2.id, entry2);
        test.set(entry3.id, entry3);

        expect(test.delete(entry4.id)).toBeFalse();

        expect(test.size).toEqual(3);
        expect(test.get(entry1.id)).toBeDefined();
        expect(test.get(entry2.id)).toBeDefined();
        expect(test.get(entry3.id)).toBeDefined();

        // expected observe results:
        expect(subscriptionResults).toEqual([
          `add:${entry1.id}`,
          `add:${entry2.id}`,
          `add:${entry3.id}`
        ]);
      });
    });

    describe('clear', () => {
      it('should delete all existing entries', () => {
        const test = new DeltaMap<string, any>();
        subscribeHandlers(test);

        test.set(entry1.id, entry1);
        test.set(entry2.id, entry2);
        test.set(entry3.id, entry3);

        subscriptionResults = [];

        test.clear();

        expect(test.size).toEqual(0);

        // expected observe results:
        expect(subscriptionResults.sort()).toEqual([
          `delete:${entry1.id}`,
          `delete:${entry2.id}`,
          `delete:${entry3.id}`
        ].sort());
      });
    });
  });

  describe('destroy', () => {
    it('should delete all existing entries and complete the Observable', () => {
      let results: MapDelta<string, IdObject>[] = [];
      const test = new DeltaMap<string, IdObject>();
      const subscription = test.delta$.subscribe(result => results.push(result));

      test.set(entry1.id, entry1);
      test.set(entry2.id, entry2);
      test.set(entry3.id, entry3);

      results = [];

      test.destroy();

      expect(results.length).toBe(1);
      expect(results[0].deleted.size).toBe(3);

      expect(subscription.closed).toBeTrue();
    });

    it('should delete all existing entries and complete the Observable, even if delta was paused', () => {
      let results: MapDelta<string, IdObject>[] = [];
      const test = new DeltaMap<string, IdObject>();
      const subscription = test.delta$.subscribe(result => results.push(result));

      test.set(entry1.id, entry1);
      test.set(entry2.id, entry2);
      test.set(entry3.id, entry3);

      results = [];

      test.pauseDelta();
      test.destroy();

      expect(results.length).toBe(1);
      expect(results[0].deleted.size).toBe(3);

      expect(subscription.closed).toBeTrue();
    });
  });

  describe('protected publishChanges', () => {
    it('should publish changes the first time it is updated, even if the set is empty', () => {
      const results: MapDelta<string, IdObject>[] = [];
      const test = new DeltaMap<string, IdObject>();
      const subscription = test.delta$.subscribe(result => results.push(result));

      test.delete(entry1.id);

      // first action should trigger publication, even if it does not do anything
      expect(results.length).toEqual(1);

      test.delete(entry1.id);

      // if nothing is changed later, no updates should be published
      expect(results.length).toEqual(1);
      subscription.unsubscribe();
    });

    it('should publish changes the first time it is updated, even if the set is empty, if publishEmpty setting is true', () => {
      const results: MapDelta<string, IdObject>[] = [];
      const test = new DeltaMap<string, IdObject>({ publishEmpty: true });
      const subscription = test.delta$.subscribe(result => results.push(result));

      test.delete(entry1.id);

      // first action should trigger publication, even if it does not do anything
      expect(results.length).toEqual(1);

      test.delete(entry1.id);

      // if nothing is changed later, no updates should be published
      expect(results.length).toEqual(1);
      subscription.unsubscribe();
    });

    it('should not publish for empty set if publishEmpty setting is false', () => {
      const results: MapDelta<string, IdObject>[] = [];
      const test = new DeltaMap<string, IdObject>({ publishEmpty: false });
      const subscription = test.delta$.subscribe(result => results.push(result));

      test.delete(entry1.id);

      // first action not should trigger publication if it does not do anything
      expect(results.length).toEqual(0);

      test.delete(entry1.id);

      // if nothing is changed later, no updates should be published
      expect(results.length).toEqual(0);
      subscription.unsubscribe();
    });
  });
});
