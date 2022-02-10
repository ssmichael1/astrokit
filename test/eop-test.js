import * as ak from '../dist/src/index.js'
import axios from 'axios'
import HttpsProxyAgent from 'https-proxy-agent'
import fs from 'fs'
import tape, { test } from 'tape'

const axios_config = (query_url) => {
    let config = { url: query_url }

    if (process.env.https_proxy != undefined) {
        config.proxy = false;
        config.httpsAgent = HttpsProxyAgent(process.env.https_proxy)
    }
    return config
}

const local_fname = './finals.all.iau2000'


// get the file
if (!fs.existsSync(local_fname)) {
    let res = await axios.request(axios_config(ak.eop.fileURL))
    fs.writeFileSync(local_fname, res.data)

}

tape('EOP Load Validation', (test) => {
    let raw = fs.readFileSync(local_fname).toString()
    let eop = ak.eop.loadFromRawString(raw)
    test.assert(eop[0].mjd === 41684)
    test.end()
})