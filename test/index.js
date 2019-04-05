// @ts-check
/// <reference types=".." />
"use strict";

const engine = new HE.Engine({
    inspector: new HE.Inspector(),
    renderer: new HE.Renderer({
        ratio: 2,
    }),
});

const menuScene = new HE.Scene({
    background: '#fff',
    delay: 100,
});

const title = new HE.Text({
    content: 'Hello, world!',
    style: {
        font: 'bold 36px Consolas',
        fillStyle: '#6f0',
        strokeStyle: '#03f',
        lineWidth: 4,
        lineJoin: 'round',
        shadowColor: '#ccc',
        shadowBlur: 10,
        shadowOffsetY: -10,
    },
});
menuScene.add(title);

engine.enter(menuScene);
