/*!
  * @doclify/javascript v3.0.0
  * (c) 2020 Doclify
  * @license MIT
  */
import axios from 'axios';

class Documents {
  constructor (client) {
    this.client = client;

    this.langCode = client.config.lang;
    this.q = [];
    this.includeQuery = [];
    this.selectQuery = [];
    this.orderQuery = [];
  }

  where (field, operator, value) {
    if (typeof value === 'undefined') {
      value = operator;
      operator = 'eq';
    }

    this.q.push([field, operator, value]);
    return this
  }

  collection (value) {
    return this.eq('sys.collection', value)
  }

  contentType (value) {
    return this.eq('sys.contentType', value)
  }

  id (value) {
    return this.eq('sys.id', value)
  }

  uid (value) {
    return this.eq('sys.uid', value)
  }

  eq (field, value) {
    return this.where(field, value)
  }

  not (field, value) {
    return this.where(field, 'not', value)
  }

  in (field, value) {
    return this.where(field, 'in', value)
  }

  nin (field, value) {
    return this.where(field, 'nin', value)
  }

  gt (field, value) {
    return this.where(field, 'gt', value)
  }

  gte (field, value) {
    return this.where(field, 'gte', value)
  }

  lt (field, value) {
    return this.where(field, 'lt', value)
  }

  lte (field, value) {
    return this.where(field, 'lte', value)
  }

  fulltext (field, value) {
    return this.where(field, 'fulltext', value)
  }

  match (field, value) {
    return this.where(field, 'match', value)
  }

  query (query) {
    if (typeof query !== 'function') {
      throw new TypeError('Query parameter must be function.')
    }

    query.call(this, this);

    return this
  }

  lang(lang) {
    this.langCode = lang;

    return this
  }

  // deprecated
  with (field) {
    return this.include(field)
  }

  include(...fields) {
    if (fields.length && Array.isArray(fields[0])) {
      fields = fields[0];
    }

    this.includeQuery.push(...fields);

    return this
  }

  select (...fields) {
    if (fields.length && Array.isArray(fields[0])) {
      fields = fields[0];
    }
    
    this.selectQuery.push(...fields);

    return this
  }

  orderBy (field, asc) {
    this.orderQuery.push([field, asc || 'asc']);

    return this
  }

  getParams(params = {}) {
    return Object.assign({
      q: JSON.stringify(this.q),
      include: this.includeQuery.length ? JSON.stringify(this.includeQuery) : undefined,
      order: this.orderQuery.length ? JSON.stringify(this.orderQuery) : undefined,
      select: this.selectQuery.length ? JSON.stringify(this.selectQuery) : undefined,
      lang: this.langCode
    }, params)
  }

  fetch (limit) {
    return this.client.cachedRequest('documents/search', {
      params: this.getParams({
        limit
      })
    })
  }

  // deprecated
  paginated (page, perPage) {
    return this.paginate(page, perPage)
  }

  paginate (page, perPage) {
    return this.client.cachedRequest('documents/paginated', {
      params: this.getParams({
        perPage,
        page,
      })
    })
  }

  first () {
    return this.client.cachedRequest('documents/single', {
      params: this.getParams()
    })
  }
}

class APIError extends Error {
  constructor (message, info) {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain

    this.info = info;
  }

  get url () {
    return this.info.url
  }

  get method () {
    return this.info.method.toUpperCase()
  }

  get code () {
    return `${this.info.code || -1}`
  }

  get params () {
    return this.info.params || {}
  }

  get error () {
    return this.info.error || null
  }

  get data () {
    return this.info.data || {}
  }

  toString () {
    return [
      'Doclify call failed:',
      `${this.method} ${this.url} ${JSON.stringify(this.params)} -`,
      this.message,
      `(code ${this.code})`
    ].join(' ')
  }

  static fromError (err) {
    const info = {
      code: err.response ? err.response.status : null,
      url: err.request.url,
      method: err.request.method,
      data: err.response ? err.response.data : null
    };

    return new APIError(err.message, info)
  }
}

function cloneObject(obj) {
  return JSON.parse(JSON.stringify(obj))
}

class Client {
  constructor (options = {}) {
    if (!options.url) {
      if (!options.repository) {
        throw new TypeError('Repository or URL option is required.')
      }
  
      if (!options.key && !options.token) {
        throw new TypeError('API key/token is required.')
      }
    }

    options.token = options.token || options.key || null;

    if (options.cache) {
      this.setCache(options.cache);
      delete options.cache;
    }

    this.config = Object.assign({
      url: null,
      repository: null,
      token: null,
      lang: null,
      timeout: 10000
    }, options);

    const headers = {};

    if (this.config.token) {
      headers.Authorization = 'Bearer ' + this.config.token;
    }

    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: this.config.timeout,
      headers
    });

    this.http.interceptors.response.use((response) => {
      return response
    }, function (err) {
      return Promise.reject(err)
    });
  }

  get baseUrl () {
    return this.config.url || `https://${this.config.repository}.cdn.doclify.io/api/v2`
  }

  setCache(cache) {
    this.cache = cache;
  }

  setLang(lang) {
    this.config.lang = lang;
  }

  getCacheKey(endpoint, params) {
    const paramsArray = [];

    Object.keys(params).sort().forEach(key => {
      paramsArray.push(`${key}=${params[key]}`);
    });

    return `${endpoint}?${paramsArray.join('&')}`
  }

  request (endpoint, options = {}, returnResponse = false) {
    options.params = options.params || {};
    
    if (this.config.lang && !options.params.lang) {
      options.params.lang = this.config.lang;
    }

    return this.http.request(endpoint, options)
      .then(res => {
        return returnResponse ? res : res.data
      })
      .catch(err => {
        const responseData = err.response && err.response.data ? err.response.data : {};

        const info = {
          url: this.baseUrl + '/' + endpoint,
          code: err.response ? err.response.status : -1,
          params: options.params,
          method: options.method || 'GET',
          error: responseData.error || null,
          data: responseData
        };

        const message = responseData.error ? responseData.error.message : err.message;

        return Promise.reject(new APIError(message, info))
      })
  }

  cachedRequest (endpoint, options = {}) {
    if (!this.cache) {
      return this.request(endpoint, options)
    }

    const key = this.getCacheKey(endpoint, options.params || {});

    const cache = this.cache.get(key);

    if (cache instanceof Promise) {
      // the same request is being processed, so we wait for completion
      return cache.then(res => cloneObject(res.data))
    } else if (cache instanceof Error) {
      return Promise.reject(cache)
    } else if (typeof cache !== 'undefined') {
      return Promise.resolve(cloneObject(cache))
    }

    const request = this.request(endpoint, options, true);

    this.cache.set(key, request);

    return request
      .then(res => {
        this.cache.set(key, res.data);

        // return copy of data
        return cloneObject(res.data)
      }).catch(err => {
        this.cache.set(key, err);

        throw err
      })
  }

  documents () {
    return new Documents(this)
  }
}

export default Client;
