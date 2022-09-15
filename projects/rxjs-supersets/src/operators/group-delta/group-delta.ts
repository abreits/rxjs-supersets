import { map } from 'rxjs';

import { DeltaSet } from '../../delta-set/delta-set';

import { MapDelta, IdObject, GroupObject, DeltaObservable, GroupObjectType } from '../../types';


/**
 * rxjs operator that passes _all_ entries in _added_ on the first passthrough
 */
export function groupDelta<
  VE extends Readonly<IdObject<KE>>,  // Value Entry
  VG extends GroupObject<VE, KG, KE>, // Value Group
  KE = string,                        // Key Entry
  KG = string                         // Key Group
>(GroupClass: GroupObjectType<VE, VG, KE, KG>, createGroupId: (entry: VE) => KG): (delta: DeltaObservable<KE, VE>) => DeltaObservable<KG, VG> {
  const groupEntryMap = new Map<KE, VG>();
  const groupSet = new DeltaSet<VG, KG>();
  groupSet.pauseDelta();

  return map((delta: MapDelta<KE, VE>) => {
    if (delta.all.size === 0) {
      // optimization for empty source map
      groupSet.clear();
    } else {
      addEntries(delta.modified);
      addEntries(delta.added);
      removeEntries(delta.deleted);
    }
    const newDelta = groupSet.getDelta();
    groupSet.clearDelta();
    return newDelta;
  });

  function addEntries(set: ReadonlyMap<KE, VE>) {
    for (const entry of set.values()) {
      const lastGroup = groupEntryMap.get(entry.id);
      const groupId = createGroupId(entry);

      // check if moved to other group
      if (lastGroup && lastGroup.id !== groupId) {
        // moved to other group, delete entry from last group
        if (lastGroup.remove(entry)) {
          groupSet.add(lastGroup); // update, group still has items remaining
        } else {
          groupSet.delete(lastGroup.id); // group has no items remaining, so delete it
        }
      }

      const group = getGroup(groupId, entry);
      groupEntryMap.set(entry.id, group);
      groupSet.add(group);
    }
  }

  function getGroup(groupId: KG, entry: VE): VG {
    const group = groupSet.get(groupId);
    if (group) {
      group.add(entry);
      return group;
    } else {
      const newGroup = new GroupClass(groupId);
      newGroup.add(entry);
      return newGroup;
    }
  }

  function removeEntries(set: ReadonlyMap<KE, VE>) {
    for (const entry of set.values()) {
      const group = groupEntryMap.get(entry.id);
      if (group) {
        groupEntryMap.delete(entry.id);
        if (group.remove(entry)) {
          groupSet.add(group); // update, group still has items remaining
        } else {
          groupSet.delete(group.id); // group has no items remaining, so delete it
        }
      }
    }
  }
}
