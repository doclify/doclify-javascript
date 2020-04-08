import axios from 'axios'
import Cache from './Cache'
import Documents from './Documents'
import APIError from './Error'

import { cloneObject } from './utils'

export default class Client {
  constructor (options) {
    if (!options.repository && !options.url) {
      throw new TypeError('Repository or URL option is required')
    }

    if (!options.key) {
      throw new TypeError('API key is required')
    }

    this.config = Object.assign({
      repository: null,
      key: null,
      cache: false,
      timeout: 10000
    }, options)

    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'x-api-key': this.config.key
      }
    })

    this.http.interceptors.response.use((response) => {
      return response
    }, function (err) {
      return Promise.reject(err)
    })

    const cacheConfig = typeof this.config.cache === 'object' && this.config.cache ? this.config.cache : {}

    this.cache = new Cache({
      maxAge: typeof cacheConfig.maxAge === 'number' ? cacheConfig.maxAge : 30,
      maxSize: cacheConfig.maxSize || 3 * 1024 * 1024,
      maxLength: cacheConfig.maxLength || 1000
    })
  }

  get baseUrl () {
    return this.config.url || `https://${this.config.repository}.cdn.doclify.io/api/v2`
  }

  request (endpoint, options = {}, returnResponse = false) {
    return this.http.request(endpoint, options)
      .then(res => {
        return returnResponse ? res : res.data
      })
      .catch(err => {
        const responseData = err.response && err.response.data ? err.response.data : {}

        const info = {
          url: this.baseUrl + '/' + endpoint,
          code: err.response ? err.response.status : -1,
          params: options.params || {},
          method: options.method || 'GET',
          error: responseData.error || null,
          data: responseData
        }

        const message = responseData.error ? responseData.error.message : err.message

        return Promise.reject(new APIError(message, info))
      })
  }

  cachedRequest (endpoint, options = {}) {
    if (!this.config.cache) {
      return this.request(endpoint, options)
    }

    const key = `${endpoint}:${JSON.stringify(options.params)}`

    const cached = this.cache.get(key)

    if (cached instanceof Promise) {
      // the same request is being processed, so we wait for completion
      return cached.then(res => cloneObject(res.data))
    } else if (cached instanceof Error) {
      return Promise.reject(cached)
    } else if (typeof cached !== 'undefined') {
      return Promise.resolve(cloneObject(cached))
    }

    options.headers = options.headers || {}
    options.headers['x-cache'] = '1'

    const request = this.request(endpoint, options, true)

    this.cache.set(key, request, {
      size: 1
    })

    return request
      .then(res => {
        const size = Number(res.headers['content-length']) || 0

        this.cache.set(key, res.data, {
          size
        })

        // return copy of data
        return cloneObject(res.data)
      }).catch(err => {
        this.cache.set(key, err)

        throw err
      })
  }

  documents () {
    return new Documents(this)
  }
}
