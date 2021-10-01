//import { readFileSync } from 'fs'
//import { wasmsgp4 } from './build/wasmsgp4.js'

import * as wm from './build/wasmsgp4.wasm'
console.log(wm.default())

//ccall = require('./build/wasmsgp4.cjs')
const tle_lines = [
    '0 ISS(ZARYA)',
    '1 25544U 98067A   21267.21567994  .00001839  00000-0  42318-4 0  9994',
    '2 25544  51.6435 213.0833 0003460  47.4035  50.6925 15.48430119303944',
]

