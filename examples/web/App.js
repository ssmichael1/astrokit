import express from 'express'
//ar path = require('path');
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch-with-proxy'
import fs from 'fs'

const app = express()
const port = 5000



// Get list of active satellites
var active_tles = null
var satnames = null
function parse_active_lines(text) {
    active_tles = text.split('\r\n').map(element => element.trim())
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


app.get('/satnames', (req, res) => {
    res.json(satnames)
})

// For getting TLE of specific satellite
app.get('/sattle/:satname', (req, res) => {
    let satname = req.params.satname
    let idx = active_tles.indexOf(req.params.satname)
    if (idx == -1) {
        res.json({})
        return
    }
    let tle = active_tles.slice(idx, idx + 3)
    tle[0] = '0 ' + tle[0]
    res.json(tle)
})


// Custom javascript files
app.use('/astrojs', express.static('../../dist/'))
app.use('/js', express.static('../../node_modules/'))
app.use('/', express.static('./'))
//////////////////////////////////////////////////////////
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
