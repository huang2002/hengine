# hengine

> A simple graphic engine for `canvasom`.

## Links

- [Documentation](https://github.com/huang2002/hengine/wiki)
- [Changelog](./CHANGELOG.md)
- [License (MIT)](./LICENSE)

## Example

```javascript
const engine = new HE.CanvasEngine({
    interactive: true,
    renderer: new COM.Renderer({
        canvas: document.getElementById('canvas'),
        width: 480,
        height: 320,
        ratio: 2,
    }),
    style: {
        fillStyle: '#FFF',
    },
    resizerOptions: {
        container: document.body,
        padding: 10,
    },
});

const startScene = COM.create(HE.SceneNode, {
    id: 'start-scene',
}, [
    COM.create(COM.TextNode, {
        stretch: 1,
        content: 'hello world',
        style: {
            fillStyle: '#000',
            textAlign: 'center',
            textBaseline: 'middle',
        },
    }),
]);

engine.enter(startScene);

engine.resizer.update(() => {
    engine.updateAndRender();
});
```
