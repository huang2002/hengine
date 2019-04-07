// @ts-check
/// <reference types=".." />
"use strict";

const renderer = new HE.Renderer({
    ratio: 2,
});

const inspector = new HE.Inspector();

const engine = new HE.Engine({ inspector, renderer });

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
        shadowBlur: 5,
        shadowOffsetY: 2,
    },
});
title.position.y = -100;
menuScene.add(title);

engine.enter(menuScene);
