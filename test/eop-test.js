import * as ak from '../dist/src/index.js'
import axios from 'axios'
import HttpsProxyAgent from 'https-proxy-agent'
import fs from 'fs'
import tape from 'tape'

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

tape('EOP Validation', (test) => {
    let raw = fs.readFileSync(local_fname).toString()
    ak.eop.loadFromString(raw)

    test.assert(ak.eop.raw()[0].mjd === 41684, 'EOP record 0 is correct')
    let d = new Date(Date.UTC(2021, 3, 20, 0, 0, 0))
    let c = ak.eop.get(d)
    test.assert(c.mjd == d.mjd(), 'EOP lookup working')

    d = new Date(Date.UTC(2019, 6, 13))
    let jdutc = d.jd(ak.TimeScale.UTC)
    let jdut1 = d.jd(ak.TimeScale.UT1)
    test.assert(Math.abs((jdut1 - jdutc) * 86400 - ak.eop.get(d).dut1) < 1e-4,
        'Date extensions UT1 lookup is working')
    test.end()
})