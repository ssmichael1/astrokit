import express from 'express'
//ar path = require('path');
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'

const app = express()
const port = 5000

// On the server side, get the url


const tleurl = 'http://www.celestrak.com/NORAD/elements/stations.txt'
var iss_tlelines = null
fetch(tleurl)
    .then(res => res.text())
    .then(text => {
        let lines = text.split('\r\n')
        iss_tlelines = lines.slice(0, 3)
        console.log(iss_tlelines)
    });

// Some definitions for static files
app.get('/', function (req, res) {

    res.sendFile(dirname(fileURLToPath(import.meta.url)) + '/index.html')
})
// app.get('/favicon.ico', function (req, res) { res.sendFile(path.join(__dirname + "/favicon.ico")) })

app.get('/iss_tle', (req, res) => {
    res.send(iss_tlelines)
})

// Custom javascript files
app.use('/astrojs', express.static('../../dist/'))
app.use('/js', express.static('../../node_modules/'))
app.use('/', express.static('./'))
//////////////////////////////////////////////////////////
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
