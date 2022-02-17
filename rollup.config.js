import babel from "@rollup/plugin-babel";
import nodeResolve from "@rollup/plugin-node-resolve";

const input = './js/index.js';
const external = ['canvasom'];

export default [
    {
        input,
        plugins: [
            nodeResolve(),
            babel({
                babelHelpers: 'bundled',
                presets: [
                    ['@babel/preset-env', {
                        loose: true,
                    }],
                ],
            }),
        ],
        external,
        output: {
            format: 'umd',
            name: 'HE',
            file: './dist/hengine.umd.js',
            globals: {
                canvasom: 'COM',
            },
        },
    },
    {
        input,
        external,
        plugins: [
            nodeResolve(),
        ],
        output: {
            format: 'esm',
            file: './dist/hengine.js',
        },
    },
];
