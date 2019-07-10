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

const { timer, pointer } = engine;

let timestamp = 'Loading';
timer.setInterval(now => {
    timestamp = `Timestamp: ${now()}`;
}, 1000, Date.now);
engine.on('didRender', ({ context, bounds }) => {
    Object.assign(context, {
        font: '10px Consolas',
        textAlign: 'right',
        textBaseline: 'bottom',
        fillStyle: '#00f',
    });
    context.fillText(timestamp, bounds.right - 10, bounds.bottom - 10);
});

const menuScene = engine.createScene({
    background: '#cdf',
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
    }).on('start', () => {
        menuScene.fps = 50;
    }).on('update', y => {
        playButton.moveTo(playButton.position.x, y);
    }).on('end', () => {
        menuScene.delay = 500;
    })
);

const mainScene = engine.createScene({
    background: '#fff',
    camera: new HE.Camera({
        position: Vector.of(20, 10),
        scale: Vector.of(.9, .9),
    }),
});

const rotationTransition = new HE.Transition({
    active: false,
    target: mainScene.camera,
    key: 'rotation',
    from: Math.PI,
    to: 0,
    duration: 5000,
});
mainScene.use(rotationTransition).on('enter', () => {
    rotationTransition.start();
});

function label(object, info) {
    object.attachments.push(new HE.Text({
        content: info,
        style: {
            font: '10px Consolas',
            fillStyle: '#444',
            strokeStyle: null,
        },
    }));
    return object;
}

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

const createBall = (x, y, strokeStyle, info) => label(new HE.Circle({
    tag: 'ball',
    active: true,
    draggable: true,
    position: Vector.of(x, y),
    radius: 18,
    style: {
        fillStyle: '#ff0',
        strokeStyle,
    },
}), info);

const ball1 = createBall(-170, -150, '#f60', 'ball1');
mainScene.add(
    ball1.on('didUpdate', function () {
        this.style.strokeStyle = this.isStatic ? '#f00' : '#0c0';
    }).once('collision', (...args) => {
        console.log('Ball1 collision:', ...args);
    })
);

const ball2 = createBall(-60, -150, '#c00', 'ball2');
mainScene.add(ball2);

const ball3 = createBall(-170, -200, '#f50', 'ball3');
mainScene.add(ball3);

const ball4 = createBall(-170, -250, '#f50', 'ball4');
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

const box1 = label(new HE.Rectangle({
    tag: 'box',
    active: true,
    draggable: true,
    position: Vector.of(-60, -200),
    width: 50,
    height: 50,
    radius: 15,
    elasticity: 1,
    style: boxStyle,
}), 'box1');
mainScene.add(box1);

mainScene.pointer.on('start', function () {
    if (mainScene.active && mainScene.pointerChecker(this, ground)) {
        mainScene.drag(box1);
    }
});

const box2 = label(new HE.Rectangle({
    tag: 'box',
    draggable: true,
    position: Vector.of(90, -150),
    width: 40,
    height: 40,
    radius: 10,
    style: boxStyle,
}), 'box2');
mainScene.add(box2);

const box3 = label(new HE.Rectangle({
    tag: 'box',
    active: true,
    draggable: true,
    position: Vector.of(-60, -400),
    width: 32,
    height: 32,
    density: 2,
    style: boxStyle,
}), 'box3');
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

const cradle = label(new HE.Circle({
    tag: 'cradle',
    active: true,
    draggable: true,
    collisionFilter: HE.Category.FULL_MASK ^ wall.category,
    position: Vector.of(150, 50),
    radius: 22,
    style: {
        fillStyle: '#f80',
    },
}), 'cradle');
mainScene.add(cradle);

const stick = new HE.Constraint({
    origin: Vector.of(150, -100),
    target: cradle,
    style: {
        strokeStyle: '#0f0',
    },
});
mainScene.add(stick);

const particlePool = new HE.Pool(HE.Polygon, {
    tag: 'particle',
    vertices: HE.Vertices.createStar(4, 1, 5, HE.Utils.Const.HALF_PI / 2),
    style: {
        fillStyle: '#ff0',
        strokeStyle: null,
        opacity: .9,
    },
});
const MAX_PARTICLE_COUNT = 50,
    PARTICLE_LIFE = 1e3;
let particleCount = 0,
    lastPointerPosition = '';
const addParticle = HE.Utils.throttle(function () {
    const currentPointerPosition = pointer.position + '';
    if (currentPointerPosition === lastPointerPosition) {
        return;
    }
    lastPointerPosition = currentPointerPosition;
    particleCount++;
    const particle = particlePool.get();
    particle.moveToVector(this.pointer.position);
    this.attach(particle);
    const transition = new HE.Transition({
        target: particle.style,
        key: 'opacity',
        to: 0,
        duration: PARTICLE_LIFE,
        timing: HE.Timing.easeIn,
    });
    this.use(transition);
    timer.setTimeout(scene => {
        scene.detach(particle);
        scene.disuse(transition);
        particleCount--;
    }, PARTICLE_LIFE, this);
}, 20);
mainScene.on('willUpdate', function () {
    if (particleCount < MAX_PARTICLE_COUNT) {
        addParticle.call(this);
    }
});

engine.enter(menuScene);
