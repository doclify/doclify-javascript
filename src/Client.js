import axios from 'axios'
import Documents from './Documents'
import APIError from './Error'
import * as dom from './dom'

import { cloneObject } from './utils'

export default class Client {
  constructor (options = {}) {
    if (!options.url) {
      if (!options.repository) {
        throw new TypeError('Repository or URL option is required.')
      }
  
      if (!options.key && !options.token) {
        throw new TypeError('API key/token is required.')
      }
    }

    options.token = options.token || options.key || null

    if (options.cache) {
      this.setCache(options.cache)
      delete options.cache
    }

    this.config = Object.assign({
      url: null,
      repository: null,
      token: null,
      lang: null,
      timeout: 10000
    }, options)

    const headers = {}

    if (this.config.token) {
      headers.Authorization = 'Bearer ' + this.config.token
    }

    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: this.config.timeout,
      headers
    })

    this.http.interceptors.response.use((response) => {
      return response
    }, function (err) {
      return Promise.reject(err)
    })

    this.dom = dom
  }

  get baseUrl () {
    return this.config.url || `https://${this.config.repository}.cdn.doclify.io/api/v2`
  }

  setCache(cache) {
    this.cache = cache
  }

  setLang(lang) {
    this.config.lang = lang
  }

  getCacheKey(endpoint, params) {
    const paramsArray = []

    Object.keys(params).sort().forEach(key => {
      paramsArray.push(`${key}=${params[key]}`)
    })

    return `${endpoint}?${paramsArray.join('&')}`
  }

  request (endpoint, options = {}, returnResponse = false) {
    options.params = options.params || {}
    
    if (this.config.lang && !options.params.lang) {
      options.params.lang = this.config.lang
    }

    return this.http.request(endpoint, options)
      .then(res => {
        return returnResponse ? res : res.data
      })
      .catch(err => {
        const responseData = err.response && err.response.data ? err.response.data : {}

        const info = {
          url: this.baseUrl + '/' + endpoint,
          code: err.response ? err.response.status : -1,
          params: options.params,
          method: options.method || 'GET',
          error: responseData.error || null,
          data: responseData
        }

        const message = responseData.error ? responseData.error.message : err.message

        return Promise.reject(new APIError(message, info))
      })
  }

  cachedRequest (endpoint, options = {}) {
    if (!this.cache) {
      return this.request(endpoint, options)
    }

    const key = this.getCacheKey(endpoint, options.params || {})

    const cache = this.cache.get(key)

    if (cache instanceof Promise) {
      // the same request is being processed, so we wait for completion
      return cache.then(res => cloneObject(res.data))
    } else if (cache instanceof Error) {
      return Promise.reject(cache)
    } else if (typeof cache !== 'undefined') {
      return Promise.resolve(cloneObject(cache))
    }

    const request = this.request(endpoint, options, true)

    this.cache.set(key, request)

    return request
      .then(res => {
        this.cache.set(key, res.data)

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

Client.dom = dom