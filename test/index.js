// @ts-check
/// <reference types=".." />
"use strict";

const { Vector } = HE;

const renderer = new HE.Renderer({
    ratio: 2,
});

const inspector = new HE.Inspector({
    // boundsStroke: '#f00',
    velocityStroke: '#00f',
});

const engine = new HE.Engine({ inspector, renderer });

const menuScene = engine.createScene({
    background: '#cdf',
    delay: 20,
});

const title = new HE.Text({
    content: 'Hello, world!',
    style: {
        font: 'bold 40px Consolas',
        fillStyle: '#6f0',
        strokeStyle: '#03f',
        lineWidth: 4,
        lineJoin: 'round',
        shadowColor: '#999',
        shadowBlur: 5,
        shadowOffsetY: 2,
    },
});
title.position.y = -80;

const titleLayer = renderer.createLayer({
    objects: [title],
    offset: Vector.of(0, -80),
    width: 350,
    height: 60,
});
titleLayer.cache(true);
menuScene.attach(titleLayer);

const playButton = new HE.Rectangle({
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
menuScene.attach(
    playButton.on('click', (position, id, event) => {
        console.log('Button clicked at ' + position, ' (id:' + id + ')', event);
        engine.enter(mainScene);
    })
).use(
    new HE.Transition({
        from: renderer.bounds.bottom + playButton.height / 2,
        to: 0,
        duration: 2000,
        timing: HE.Timing.easeInOut,
    }).on('update', y => {
        playButton.moveTo(playButton.position.x, y);
    }).on('end', () => {
        menuScene.fps = 10;
    })
);

const mainScene = engine.createScene({
    background: '#fff',
});

const ground = new HE.Rectangle({
    tag: 'ground',
    position: Vector.of(-10, 100),
    width: 400,
    height: 50,
    style: {
        fillStyle: '#ccc',
        strokeStyle: '#222'
    },
});
mainScene.add(ground);

const slope = new HE.Polygon({
    tag: 'slope',
    collisionFilter: HE.Category.FULL_MASK ^ ground.category,
    position: Vector.of(-190, 0),
    adjustment: false,
    staticFriction: 0,
    elasticity: 0,
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

const wall = new HE.Rectangle({
    tag: 'wall',
    collisionFilter: HE.Category.FULL_MASK ^ ground.category,
    position: Vector.of(200, 0),
    width: 20,
    height: 250,
    style: {
        strokeStyle: '#444',
        fillStyle: '#999',
    },
});
mainScene.add(wall);

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
    ball1.on('didUpdate', function () {
        this.style.strokeStyle = this.isStatic ? '#f00' : '#0c0';
    }).once('collision', (...args) => {
        console.log('Ball1 collision:', ...args);
    })
);

const ball2 = createBall(-60, -150, '#c00');
mainScene.add(ball2);

const ball3 = createBall(-170, -200, '#f50');
mainScene.add(ball3);

const ball4 = createBall(-170, -250, '#f50');
mainScene.add(ball4);

const constraint = new HE.Constraint({
    origin: ball3,
    target: ball4,
    stiffness: .9,
    style: {
        strokeStyle: '#0f0'
    },
});
mainScene.add(constraint);

const boxStyle = {
    fillStyle: '#960',
    strokeStyle: '#603',
};

const box1 = new HE.Rectangle({
    tag: 'box',
    active: true,
    draggable: true,
    position: Vector.of(-60, -200),
    width: 50,
    height: 50,
    radius: 15,
    elasticity: 1,
    style: boxStyle,
});
mainScene.add(box1);

mainScene.pointer.on('start', function () {
    if (mainScene.active && mainScene.pointerChecker(this, ground)) {
        mainScene.drag(box1);
    }
});

const box2 = new HE.Rectangle({
    tag: 'box',
    draggable: true,
    position: Vector.of(90, -150),
    width: 40,
    height: 40,
    radius: 10,
    style: boxStyle,
});
mainScene.add(box2);

const box3 = new HE.Rectangle({
    tag: 'box',
    active: true,
    draggable: true,
    position: Vector.of(-60, -400),
    width: 32,
    height: 32,
    density: 2,
    style: boxStyle,
});
mainScene.add(box3);
inspector.callbacks.push(() => `box3 Contact Count: ${mainScene.active ? box3.contact.size : 'N/A'}`);

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
    position: Vector.of(150, 50),
    radius: 22,
    style: {
        fillStyle: '#f80',
    },
});
mainScene.add(cradle);

const stick = new HE.Constraint({
    origin: Vector.of(150, -100),
    target: cradle,
    style: {
        strokeStyle: '#0f0',
    },
});
mainScene.add(stick);

engine.enter(menuScene);
