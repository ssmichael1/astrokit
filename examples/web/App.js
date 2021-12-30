import express from 'express'

//ar path = require('path');
import { dirname } from 'path'
import { fileURLToPath } from 'url'



const app = express()
const port = 5000

// Some definitions for static files
app.get('/', function (req, res) { res.sendFile(dirname(fileURLToPath(import.meta.url)) + '/index.html') })
// app.get('/favicon.ico', function (req, res) { res.sendFile(path.join(__dirname + "/favicon.ico")) })

// Custom javascript files
app.use('/wasm', express.static('../../cpp/build/'))
app.use('/astrojs', express.static('../../dist/'))
app.use('/js', express.static('../../node_modules/'))
app.use('/', express.static('./'))
//////////////////////////////////////////////////////////
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
