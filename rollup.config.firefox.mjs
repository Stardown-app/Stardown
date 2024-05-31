// https://rollupjs.org/
import copy from 'rollup-plugin-copy'; // https://www.npmjs.com/package/rollup-plugin-copy

export default [
    {
        input: 'src/background.js',
        output: {
            file: 'firefox/background.js',
            format: 'iife',
        },
        plugins: [
            copy({
                targets: [
                    {
                        src: [
                            'src/images',
                            'src/fragment-generation-utils.js',
                            'src/options.html',
                            'src/text-fragment-utils.js'
                        ],
                        dest: 'firefox'
                    },
                ]
            })
        ]
    },
    {
        input: 'src/content.js',
        output: {
            file: 'firefox/content.js',
            format: 'iife',
        },
    },
    {
        input: 'src/options.js',
        output: {
            file: 'firefox/options.js',
            format: 'iife',
        },
    }
];
