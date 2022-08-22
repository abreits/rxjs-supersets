# `createDelta(fromDefinition)`

The `createDelta` utility function can be used to easily create MapDelta instances for unit testing.

[back to main](../../README.md)

`createDelta` has the following call structure:

``` typescript
function createDelta<V extends IdObject<K>, K = string>(fromDefinition: {
  all?: V | V[],
  added?: V | V[],
  modified?: V | V[],
  deleted?: V | V[]
}): MapDelta<K, V>
```
