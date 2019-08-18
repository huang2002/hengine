## 0.39.0 - 2019-08-18

- Add `renderer.createUIVector`
- Modify default stroke style

### 0.38.6 - 2019-08-17

- Fix the time to emit `resize` events on renderer instances

### 0.38.5 - 2019-08-17

- Fix a bug in `eventEmitter.emit`

### 0.38.4 - 2019-08-16

- Fix `eventEmitter.off`

### 0.38.3 - 2019-08-16

- Fix `eventEmitter.off`

### 0.38.2 - 2019-08-16

- Fix the time to emit `willRender` events on scene instances

### 0.38.1 - 2019-08-15

- Fix legacy clearing in `Particles`

## 0.38.0 - 2019-08-14

- Add `body.x` & `body.y`
- Add `Utils.ThrottleWrapper.lastCallTime`

### 0.37.3 - 2019-08-05

- Fix a bug in layer rendering

### 0.37.2 - 2019-08-05

- fix layer rendering

### 0.37.1 - 2019-08-04

- Fix a bug in resizing

## 0.37.0 - 2019-08-04

- Modify default `renderer.margin`
- Fix renderer sizing

## 0.36.0 - 2019-08-02

- Add `Utils.Const.IS_TOUCH_MODE`
- Fix touch mode detection

### 0.35.1 - 2019-08-02

- Fix inspector rendering

## 0.35.0 - 2019-08-01

- Add `paragraph.rotation` & `text.rotation`

### 0.34.1 - 2019-08-01

- Fix `paragraph.render` & `text.render`

## 0.34.0 - 2019-08-01

- Add `particles.loop`
- Add `Utils.pick`

### 0.33.2 - 2019-08-01

- fix `pool.get`

### 0.33.1 - 2019-08-01

- fix particle spawning

## 0.33.0 - 2019-07-31

- Add `Utils.random`

## 0.32.0 - 2019-07-31

- Add `engine.maxDelay`
- Remove `engine.maxTimeScale`

## 0.31.0 - 2019-07-22

- Add `Particles`
- Add `Vector.random`
- Add `Utils.insert`
- Improve `Utils.removeIndex` & `Utils.mix`
- Improve `body.gravity`

## 0.30.0 - 2019-07-17

- Improve default `ratio`

## 0.29.0 - 2019-07-11

- Add camera APIs
- Add `pointer.pretransform`
- Rename `renderer.outer2inner` `renderer.toInnerPosition`
- Rename `renderer.inner2outer` `renderer.toOuterPosition`
- Fix `size` setter in pool

## 0.28.0 - 2019-07-09

- Add `engine.restoration`
- Add `engine.rerenderOnResize`
- Add `timer.setInterval` & `timer.clearInterval`
- Add events to engine instances
- Rename `timer.set/clearSchedule` `timer.set/clearTimeout`
- Modify the arguments of `render` events on scene instances
- Modify `delay` handling in timers
- Modify `resize` event condition in renderers
- Improve some internals

## 0.27.0 - 2019-07-04

- Add `timer.setSchedule` & `timer.clearSchedule`

### 0.26.1 - 2019-06-30

- Fix stacking

## 0.26.0 - 2019-02-18

- Completely rewrite
