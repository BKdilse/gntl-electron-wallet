/**
 * gntl-electron-wallet
 * https://github.com/gntl/gntl-electron-wallet
 *
 * market.js
 *
 **/

// const https = require("https")

// const axios = require('axios');

import { RPC } from './rpc'

export class Market {
    constructor (backend) {
        this.backend = backend
        this.heartbeat_slow = null
        this.id = 0

        // this.agent = new https.Agent({ keepAlive: true, maxSockets: 1 })
        this.options = null
        this.endpoint = "/api/v3/coins/gntl/tickers"
        this.rpc = new RPC()
    }

    start (options) {
        return new Promise((resolve, reject) => {
            this.options = options
            resolve()
        })
    }

    handle (data) {
        switch (data.method) {
        case "open_wallet":
            this.startHeartbeat()
            break
        case "close_wallet":
            clearInterval(this.heartbeat)
            clearInterval(this.heartbeat_slow)
            break
        default:
        }
    }

    startHeartbeat () {
        clearInterval(this.heartbeat_slow)
        this.heartbeat_slow = setInterval(() => {
            this.heartbeatSlowAction()
        }, 2 * 60 * 1000) // 2 minutes
        this.heartbeatSlowAction()
    }

    async heartbeatSlowAction () {
        try {
            let response = await this.rpc.callAPI({}, this.options.market.exchange)
            let data = []
                let key = "Exbitron"
                let symbol = "BTC"
                let label = `${key} ${symbol}`
                let price = +response.result.ticker.last
                data.push({ key: label, label: label, symbol: symbol, value: price })
            this.sendGateway("set_market_data", { info: { exchanges: data } })
        } catch (error) {}
    }

    sendGateway (method, data) {
        this.backend.send(method, data)
    }

    quit () {
        clearInterval(this.heartbeat)
        clearInterval(this.heartbeat_slow)
        return new Promise((resolve, reject) => {
            resolve()
        })
    }
}
