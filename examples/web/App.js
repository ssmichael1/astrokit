import express from 'express'
//ar path = require('path');
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch-with-proxy'
import fs from 'fs'
import https from 'https'
import HttpsProxyAgent from 'https-proxy-agent'
//import { Client } from "@googlemaps/google-maps-services-js";

const app = express()
const port = 5000

const __dirname = dirname(fileURLToPath(import.meta.url));


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
    console.log('loading active satellites from celestrak')
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
app.get('/favicon.ico', function (req, res) {
    let fname = join(__dirname + "/satellite.ico")
    res.sendFile(fname)
})

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


// For getting locations
let GOOGLE_API_KEY = process.env.GOOGLE_API_KEY
console.log(GOOGLE_API_KEY)
app.get('/location/:location', (req, res) => {
    let loc = req.params.location
    console.log(loc)

    // See if it is native json
    try {
        let t = JSON.parse(loc)

        if (t.hasOwnProperty('lng') && t.hasOwnProperty('lat')) {
            res.json(t)
            return
        }
    }
    catch (e) { }

    const BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json?address='
    let url = BASE_URL + loc.replace(' ', '%20') + '&key=' + GOOGLE_API_KEY
    console.log(url)
    let options = {
        agent: https.defaultAgent,
        hostname: 'maps.googleapis.com',
        path: encodeURI('/maps/api/geocode/json?address=' + loc + '&key=' + GOOGLE_API_KEY),
        method: 'GET'
    }
    if (process.env.https_proxy != undefined) {
        options.agent = new HttpsProxyAgent(process.env.https_proxy)
    }
    const hreq = https.request(options, (response) => {
        let data = ''
        response.on('data', (chunk) => {
            data = data + chunk.toString()
        })
        response.on('end', () => {
            let js = JSON.parse(data)
            res.json(js.results[0].geometry.location)
        })
    })
    hreq.on('error', (error) => {
        console.log('error: ' + error)
        res.json({})
    })
    hreq.end()
})

// Custom javascript files
app.use('/astrojs', express.static('../../dist/'))
app.use('/js', express.static('../../node_modules/'))
app.use('/', express.static('./'))
//////////////////////////////////////////////////////////
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
