// @ts-check
/// <reference types=".." />
"use strict";

const { Vector } = HE;

const renderer = new HE.Renderer({
    ratio: 2,
});

const inspector = new HE.Inspector({
    // boundsStroke: 'rgba(0,255,0,.4)',
});

const engine = new HE.Engine({ inspector, renderer });

const menuScene = engine.createScene({
    background: '#cdf',
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
        shadowColor: '#999',
        shadowBlur: 5,
        shadowOffsetY: 2,
    },
});
title.position.y = -100;
menuScene.attach(title);

const button = new HE.Rectangle({
    interactive: true,
    position: Vector.of(0, 50),
    width: 100,
    height: 50,
    radius: 10,
    style: {
        fillStyle: '#9cf',
        strokeStyle: '#00f',
        shadowColor: '#999',
        shadowOffsetX: 5,
        shadowOffsetY: 5,
    },
    attachments: [
        new HE.Text({
            content: 'PLAY',
            style: {
                font: 'bold 25px Consolas',
                fillStyle: '#ff0',
                strokeStyle: '#f00',
                lineWidth: 2,
                shadowColor: '#fff',
                shadowOffsetY: 1,
            },
        }),
    ],
});
menuScene.attach(button.on('click', (position, id, event) => {
    console.log('Button clicked at ' + position, ' (id:' + id + ')', event);
    engine.enter(mainScene);
}));

const mainScene = engine.createScene({
    background: '#fff',
});

const ground = new HE.Rectangle({
    tag: 'ground',
    position: Vector.of(0, 100),
    width: 400,
    height: 50,
    style: {
        fillStyle: '#ccc',
        strokeStyle: '#222'
    },
});
mainScene.add(ground);

const slope = new HE.Polygon({
    tag: 'wall',
    collisionFilter: HE.Category.FULL_MASK ^ ground.category,
    position: Vector.of(-180, 0),
    adjustment: false,
    roughness: 0,
    clockwise: false,
    vertices: HE.Vertices.fromArray([
        -10, -80,
        -20, -80,
        -20, 75,
        60, 75,
    ]),
    style: {
        strokeStyle: '#060',
        fillStyle: '#0f0',
    },
});
mainScene.add(slope);

const createBall = (x, y, strokeStyle) => new HE.Circle({
    tag: 'ball',
    active: true,
    draggable: true,
    position: Vector.of(x, y),
    radius: 18,
    style: {
        fillStyle: '#ff0',
        strokeStyle,
    },
});

const ball1 = createBall(-170, -150, '#f60');
mainScene.add(
    ball1.on('didUpdate', () => {
        ball1.style.strokeStyle = '#0c0';
    }).on('collision', () => {
        ball1.style.strokeStyle = '#f00';
    }).once('collision', (...args) => {
        // console.log('Ball1 collision:', ...args);
    })
);

const ball2 = createBall(-60, -150, '#c00');
mainScene.add(ball2);

const ball3 = createBall(-170, -200, '#f50');
mainScene.add(ball3);

const ball4 = createBall(-170, -250, '#f50');
mainScene.add(ball4);

mainScene.add(new HE.Constraint({
    origin: ball3,
    target: ball4,
    minLength: 0,
    style: {
        strokeStyle: '#0f0'
    },
}));

const box1 = new HE.Rectangle({
    tag: 'box',
    active: true,
    draggable: true,
    position: Vector.of(-50, -200),
    width: 35,
    height: 35,
    density: 10,
    style: {
        fillStyle: '#960',
        strokeStyle: '#603',
    },
});
mainScene.add(box1);

const box2 = new HE.Rectangle({
    tag: 'box',
    draggable: true,
    position: Vector.of(70, -150),
    width: 35,
    height: 35,
    style: {
        fillStyle: '#960',
        strokeStyle: '#630',
    },
});
mainScene.add(box2);

mainScene.add(new HE.Constraint({
    origin: box2,
    target: ball2,
    minLength: 0,
    style: {
        strokeStyle: '#0f0'
    },
}));

const cradle = new HE.Circle({
    tag: 'cradle',
    active: true,
    draggable: true,
    position: Vector.of(160, 50),
    radius: 22,
    style: {
        fillStyle: '#f80',
    },
});
mainScene.add(cradle);

const stick = new HE.Constraint({
    origin: Vector.of(160, -100),
    target: cradle,
    style: {
        strokeStyle: '#0f0',
    },
});
mainScene.add(stick);

// engine.enter(menuScene);
engine.enter(mainScene);
