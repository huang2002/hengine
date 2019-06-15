import rollupPluginBabel from "rollup-plugin-babel";

const input = 'raw/index.js';

export default [
    {
        input,
        plugins: [
            rollupPluginBabel()
        ],
        output: {
            format: 'umd',
            name: 'HE',
            file: 'dist/hengine.umd.js',
            freeze: false
        }
    },
    {
        input,
        output: {
            format: 'esm',
            file: 'dist/hengine.js',
            freeze: false
        }
    }
];
