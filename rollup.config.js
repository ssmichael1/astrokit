import { babel } from '@rollup/plugin-babel';

const config = {
    input: 'src/index.js',
    output: {
        format: 'umd',
        file: 'dist/astrokit.js',
        name: 'ak'
    },
    plugins: [babel({ babelHelpers: 'bundled' })]
};

export default config;