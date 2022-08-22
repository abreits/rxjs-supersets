# Change Log

## 1.2.0
- Added `StartDelta()` operator
- Added `tapDelta()` operator
- Added `mapDelta()` operator
- Added `filterDelta()` operator
- Added `deltaMap.getDelta()` and `deltaMap.clearDelta()` methods
- Updated documentation

## 1.1.0
- Fixes:
  - `DeltaSet` constructor now processes entries defined in the constructor properly
  - All delta maps and sets now publish entries defined in the constructor 
- Code cleanup
- Updated documentation
  - Renamed
- TODO:
  - Further check and improve documentation
  - Add more code examples
  - implement github actions for CI/CD automation
## 1.0.0
- Breaking changes:
  - Renamed `added` to `created`
  - Renamed `modified` to `updated`
  - Renamed `deltaMap.destroy()` to `deltaMap.close()`
  - Removed `pauseSubsetDeltas()` and `resumeSubsetDeltas()` methods from `SuperSet`
- Code cleanup
- Updated documentation
- TODO:
  - Further check and improve documentation
  - Add more code examples
  - implement github actions for CI/CD automation

## 0.10.0
- Added `subsets.pauseDeltas()` and `subsets.resumeDeltas()` methods to `SuperSet`
- Deprecated `pauseSubsetDeltas()` and `resumeSubsetDeltas()` methods for `SuperSet`
- Fixed `subsets.size` property for `Superset` and `SimpleSuperSet`
- Optimized `subsets` for `Superset` and `SimpleSuperSet`
- Updated documentation
- TODO: 
  - Improve documentation 
  - Add more examples

## 0.9.0
- Initial public version
- TODO: 
  - Improve documentation
  - Add more examples