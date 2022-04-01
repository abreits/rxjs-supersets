import { Subscription } from 'rxjs';

import { DeltaMap } from '../delta-map/delta-map';
import { processDelta } from '../process-delta/process-delta';
import { IdObject, MapDelta } from '../types';

import { DeltaSet } from './delta-set';

interface ContentId extends IdObject {
  content: string;
}

const startContent: ContentId[] = [
  { id: 'entry1', content: 'a1' },
  { id: 'entry2', content: 'b1' },
  { id: 'entry3', content: 'c1' }
];

const newContent: ContentId[] = [
  // entry1 deleted
  { id: 'entry2', content: 'b1' }, // stays the same
  { id: 'entry3', content: 'c2' }, // updated
  { id: 'entry4', content: 'd1' }, // added
  { id: 'entry5', content: 'e1' }  // added
];

describe('DeltaSet', () => {
  const entry1 = { id: 'entry1' };
  const entry2 = { id: 'entry2' };

  describe('add', () => {
    it('should call set(entry.id, entry) ', () => {
      const test = new DeltaSet();

      test.add(entry1);

      expect(test.size).toEqual(1);
      expect(test.get(entry1.id)).toBe(entry1);
    });
  });

  describe('addMultiple', () => {
    it('should call set(entry.id, entry) ', () => {
      const test = new DeltaSet();

      test.addMultiple([entry1, entry2]);

      expect(test.size).toEqual(2);
      expect(test.get(entry1.id)).toBe(entry1);
      expect(test.get(entry2.id)).toBe(entry2);
    });
  });

  describe('set', () => {
    it('should do an add) ', () => {
      const test = new DeltaSet();

      test.set('ignoredEntryId', entry1);

      expect(test.get(entry1.id)).toBe(entry1);
      expect(test.get('ignoredEntryId')).not.toBeDefined();
    });
  });

  describe('replace', () => {
    it('should set the current content to newEntries', () => {
      const test = new DeltaSet<ContentId>();

      test.replace(startContent);

      expect(test.size).toEqual(startContent.length);
      startContent.forEach(entry => expect(test.has(entry.id)).toBeTrue());
    });

    it('should replace the current entries with newEntries', () => {
      const test = new DeltaSet<ContentId>();
      test.replace(startContent);

      test.replace(newContent);

      expect(test.size).toEqual(newContent.length);
      newContent.forEach(entry => expect(test.has(entry.id)).toBeTrue());
    });

    describe('delta$', () => {
      let subscriptionResults: string[];
      let subscriptions: Subscription[];
      let delta$Results: MapDelta<string, any>[];

      function subscribeHandlers(map: DeltaMap<string, any>): void {
        subscriptions.push(
          map.delta$.pipe(processDelta({
            add: (entry: any) => subscriptionResults.push(`add:${entry.id}`),
            delete: (entry: any) => subscriptionResults.push(`delete:${entry.id}`),
            modify: (entry: any) => subscriptionResults.push(`modify:${entry.id}`)
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

      describe('addMultiple', () => {
        it('should observe adding new content without isModified function', () => {
          const test = new DeltaSet<ContentId>();
          subscribeHandlers(test);
          test.addMultiple(startContent);
          subscriptionResults = [];
          delta$Results = [];

          test.addMultiple(newContent);

          expect(test.size).toEqual(5);
          expect(delta$Results.length).toEqual(1); // combined update only
          expect(subscriptionResults.sort()).toEqual([
            'add:entry4', 'add:entry5', 'modify:entry2', 'modify:entry3'
          ]);
        });

        it('should observe adding new content with isModified function', () => {
          const test = new DeltaSet<ContentId>({ isModified: (a, b) => a.content !== b.content });
          subscribeHandlers(test);
          test.addMultiple(startContent);
          subscriptionResults = [];

          test.addMultiple(newContent);

          expect(subscriptionResults.sort()).toEqual([
            'add:entry4', 'add:entry5', 'modify:entry3'
          ]);
        });
      });

      describe('replace', () => {
        it('should observe setting the start content', () => {
          const test = new DeltaSet<ContentId>();
          subscribeHandlers(test);
          test.replace(startContent);

          expect(subscriptionResults.sort()).toEqual(['add:entry1', 'add:entry2', 'add:entry3']);
        });

        it('should observe updating to new content without isModified function', () => {
          const test = new DeltaSet<ContentId>();
          subscribeHandlers(test);
          test.replace(startContent);
          subscriptionResults = [];
          delta$Results = [];

          test.replace(newContent);

          expect(delta$Results.length).toEqual(1); // combined update only
          expect(subscriptionResults.sort()).toEqual([
            'add:entry4', 'add:entry5', 'delete:entry1', 'modify:entry2', 'modify:entry3'
          ]);
        });

        it('should observe updating to new content with isModified function', () => {
          const test = new DeltaSet<ContentId>({ isModified: (a: ContentId, b: ContentId) => a.content !== b.content });
          subscribeHandlers(test);
          test.replace(startContent);
          subscriptionResults = [];

          test.replace(newContent);

          expect(subscriptionResults.sort()).toEqual([
            'add:entry4', 'add:entry5', 'delete:entry1', 'modify:entry3'
          ]);
        });
      });
    });
  });
});
