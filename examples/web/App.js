import express from 'express'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import axios from 'axios'
import HttpsProxyAgent from 'https-proxy-agent'

const app = express()
const port = 5000

const __dirname = dirname(fileURLToPath(import.meta.url));

// For getting locations
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

// Get list of active satellites
var active_tles = null
var satnames = null


const axios_config = (query_url) => {
    let config = { url: query_url }
    if (process.env.https_proxy != undefined) {
        config.proxy = false;
        config.httpsAgent = new HttpsProxyAgent(process.env.https_proxy)
    }
    return config
}

function parse_active_lines(text) {
    active_tles = text.split('\r\n').map(element => element.trim())
    satnames = active_tles
        .filter((element, index) => {
            return index % 3 == 0;
        })
        .map(element => element.trim())
}
const get_active_sats = async () => {
    if (fs.existsSync('./active.txt')) {
        let lines = fs.readFileSync('./active.txt', 'utf8')
        parse_active_lines(lines)
    }
    else {
        console.log('loading active satellites from celestrak')
        const activeurl = 'https://celestrak.com/NORAD/elements/active.txt'
        let res = await axios.request(axios_config(activeurl))
        parse_active_lines(res.data)
    }
}

await get_active_sats()

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


const getLocation = async (loc) => {
    const BASE_URL = 'https://maps.googleapis.com/' +
        'maps/api/geocode/json?address='
    let query_url = BASE_URL + loc.replace(' ', '%20')
        + '&key=' + GOOGLE_API_KEY

    try {
        const response = await axios.request(axios_config(query_url))
        return response
    }
    catch (err) {
        return ({ status: -1 })
    }
}

app.get('/location/:location', async (req, res) => {
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
    let resp2 = await getLocation(loc)
    // 
    if (resp2.status != 200) {
        res.json({})
        return
    }
    if (resp2.data.status != 'OK') {
        res.json({})
        return
    }
    res.json(resp2.data.results[0].geometry.location)
})



// Custom javascript files
app.use('/astrojs', express.static('../../dist/'))
app.use('/js', express.static('../../node_modules/'))
app.use('/', express.static('./'))
//////////////////////////////////////////////////////////
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
