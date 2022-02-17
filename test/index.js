// @ts-check
/// <reference types="canvasom" />
/// <reference types=".." />

const canvas = /** @type {HTMLCanvasElement} */(
    document.querySelector('#canvas')
);

const engine = new HE.CanvasEngine({
    interactive: true,
    renderer: new COM.Renderer({
        canvas,
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

engine.resizer.update(() => {
    engine.updateAndRender();
});

engine.appendChild(
    COM.create(COM.TextNode, {
        stretchX: 1,
        boundsHeight: 50,
        content: 'hengine test',
        style: {
            fillStyle: '#000',
            textAlign: 'center',
            textBaseline: 'middle',
        },
    })
);

/**
 * @param {string} content
 */
const SimpleText = (content) => (
    COM.create(COM.TextNode, {
        stretch: 1,
        content,
        style: {
            fillStyle: '#000',
            textAlign: 'center',
            textBaseline: 'middle',
        },
    })
);

/**
 * @param {string} content
 * @param {COM.EventListener<COM.CanvasClickEvent>} callback
 */
const SimpleButton = (content, callback) => (
    COM.create(COM.RectNode, {
        interactive: true,
        width: 100,
        height: 50,
        radius: 6,
        style: {
            fillStyle: '#FFF',
            strokeStyle: '#000',
            shadowColor: '#CCC',
            shadowBlur: 5,
            shadowOffsetY: 5,
        },
        listeners: {
            click: callback,
        },
    }, [
        SimpleText(content),
    ])
);

const startScene = COM.create(HE.SceneNode, {
    id: 'start-scene',
    interactive: true,
}, [
    COM.create(COM.AlignNode, {
        stretch: 1,
        alignX: 'center',
        alignY: 'center',
    }, [
        SimpleButton('Start', () => {
            engine.enter(mainScene);
        }),
    ]),
]);

engine.enter(startScene);

const mainScene = COM.create(HE.SceneNode, {
    id: 'main-scene',
    interactive: true,
}, [

    SimpleText('Started!'),

    COM.create(COM.AlignNode, {
        stretch: 1,
        offsetY: -30,
        alignX: 'center',
        alignY: 'end',
    }, [
        SimpleButton('Back', () => {
            engine.enter(startScene);
        }),
    ]),

]);
