# `groupDelta(GroupClass: GroupObject, createGroupId: (sourceEntry) => groupId)`

The `groupDelta` RxJS operator operates on `MapDelta` structures.
It groups the incoming `IdObject` entries into `GroupObject` subclass entries.

The group the entry is placed into is determined by the supplied `createGroupId()` function.

If a group contains no items it is deleted. If an item moves to another group, it results in 2 changes (removal from the first group and addition to the second group), these changes can create, update and/or delete groups in the resulting `MapDelta`. 

[back to main](../../../README.md)

## Examples

``` typescript
/**
 * example source entry IdObject
 **/
interface TestIdObject extends IdObject {
  group: number;
}

/**
 * example GroupObject subclass
 **/
class TestGroupObject extends GroupObject<TestIdObject, number> {
  public map = new Map<string, TestIdObject>();

  add(entry: TestIdObject) {
    this.map.set(entry.id, entry);
  }

  remove(entry: TestIdObject): boolean {
    this.map.delete(entry.id);
    return this.map.size > 0;   
  }
}

/**
 * example of a group Id creation function
 **/
function createGroupId(entry: TestIdObject): number {
  return entry.group;
}

/**
 * example of the groupDelta operator in action
 **/
subscription = deltaSet.delta$.pipe(
  groupDelta(TestGroupObject, createGroupId),
).subscribe(groupDeltaMap => console.log('updates to resulting group', groupDeltaMap));
```
[back to top](#filterdeltafilterfunction-entry--boolean)