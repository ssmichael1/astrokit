import express from 'express'
//ar path = require('path');
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch-with-proxy'
import fs from 'fs'

const app = express()
const port = 5000

// On the server side, get the url


// Get ISS TLE
const tleurl = 'https://www.celestrak.com/NORAD/elements/stations.txt'
var iss_tlelines = null
fetch(tleurl)
    .then(res => res.text())
    .then(text => {
        let lines = text.split('\r\n')
        iss_tlelines = lines.slice(0, 3)
        console.log(iss_tlelines)
    });

// Get list of active satellites
var active_tles = null
var satnames = null
//const activeurl = './active.txt'

function parse_active_lines(text) {
    active_tles = text.split('\r\n')
    satnames = active_tles
        .filter((element, index) => {
            return index % 3 == 0;
        })
        .map(element => element.trim())
}

if (fs.existsSync('./active.txt')) {
    let lines = fs.readFileSync('./active.txt', 'utf8')
    parse_active_lines(lines)
}
else {
    console.log('loading from web')
    const activeurl = 'https://celestrak.com/NORAD/elements/active.txt'
    fetch(activeurl)
        .then(res => res.text())
        .then(text => {
            parse_active_lines(text)
        })
}

// Some definitions for static files
app.get('/', function (req, res) {

    res.sendFile(dirname(fileURLToPath(import.meta.url)) + '/index.html')
})
// app.get('/favicon.ico', function (req, res) { res.sendFile(path.join(__dirname + "/favicon.ico")) })

app.get('/iss_tle', (req, res) => {
    res.send(iss_tlelines)
})
app.get('/satnames', (req, res) => {
    res.json(satnames)
})

// Custom javascript files
app.use('/astrojs', express.static('../../dist/'))
app.use('/js', express.static('../../node_modules/'))
app.use('/', express.static('./'))
//////////////////////////////////////////////////////////
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
