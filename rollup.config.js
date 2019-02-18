import rollupPluginBabel from "rollup-plugin-babel";

const input = 'raw/index.js';

export default [
    {
        input,
        output: {
            format: 'esm',
            file: 'dist/hengine.js'
        }
    },
    {
        input,
        plugins: [
            rollupPluginBabel()
        ],
        output: {
            format: 'umd',
            name: 'HEngine',
            file: 'dist/hengine.umd.js'
        }
    }
];
