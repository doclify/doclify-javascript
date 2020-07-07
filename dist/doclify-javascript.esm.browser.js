/*!
  * @doclify/javascript v2.0.6
  * (c) 2020 Doclify
  * @license MIT
  */
import axios from 'axios';

class Cache {
  constructor (options) {
    this.config = Object.assign({
      maxSize: Infinity,
      maxLength: Infinity,
      maxAge: 0,
      getSize () {
        return 1
      }
    }, options || {});

    this.entries = new Map();
    this.size = 0;
    this.newest = this.oldest = undefined;
  }

  reset () {
    this.entries.clear();
    this.size = 0;
    this.newest = this.oldest = undefined;
  }

  get length () {
    return this.entries.size
  }

  has (key) {
    return this.entries.has(key)
  }

  get (key) {
    const entry = this.entries.get(key);

    if (!entry) {
      return
    }

    if (entry.maxAge && Date.now() - entry.now > entry.maxAge * 1000) {
      this.delete(entry);

      return
    }

    return entry.value
  }

  set (key, value, options = {}) {
    const maxAge = options.maxAge || this.config.maxAge;

    if (maxAge && typeof maxAge !== 'number') {
      throw new TypeError('maxAge must be a number')
    }

    const size = typeof options.size === 'number' ? options.size : this.config.getSize(value, key);

    if (size > this.config.maxSize) {
      if (this.has(key)) {
        this.delete(key);
      }

      return false
    }

    let entry = this.entries.get(key);

    if (!entry) {
      entry = new Entry(key, value, size, maxAge);

      this.entries.set(key, entry);

      if (this.newest) {
        this.newest.newer = entry;
        entry.older = this.newest;
      } else {
        this.oldest = entry;
      }
    } else {
      this.size -= entry.size;
      entry.update(value, size, maxAge);

      this.markEntryAsUsed(entry);
    }

    this.size += size;
    this.newest = entry;

    this.cleanup();

    return true
  }

  markEntryAsUsed (entry) {
    if (entry === this.newest) {
      // Already the most recenlty used entry, so no need to update the list
      return
    }

    // HEAD--------------TAIL
    //   <.older   .newer>
    //  <--- add direction --
    //   A  B  C  <D>  E
    if (entry.newer) {
      if (entry === this.oldest) {
        this.oldest = entry.newer;
      }

      entry.newer.older = entry.older; // C <-- E.
    }
    if (entry.older) {
      entry.older.newer = entry.newer; // C. --> E
    }
    entry.newer = undefined; // D --x
    entry.older = this.newest; // D. --> E

    if (this.newest) {
      this.newest.newer = entry; // E. <-- D
    }

    this.newest = entry;
  }

  delete (keyOrEntry) {
    const entry = keyOrEntry instanceof Entry ? keyOrEntry : this.entries.get(keyOrEntry);

    if (!entry) {
      return false
    }

    this.size -= entry.size;
    entry.size = 0;
    entry.newer = entry.older = undefined;

    return this.entries.delete(entry.key)
  }

  cleanup () {
    while (this.length > this.config.maxLength || this.size > this.config.maxSize) {
      if (!this.shift()) {
        break
      }
    }
  }

  shift () {
    const entry = this.oldest;

    if (!entry) {
      return false
    }

    if (this.oldest.newer) {
      // advance the list
      this.oldest = this.oldest.newer;
      this.oldest.older = undefined;
    } else {
      // the cache is exhausted
      this.oldest = undefined;
      this.newest = undefined;
    }

    this.delete(entry);

    return true
  }
}

class Entry {
  constructor (key, value, size, maxAge) {
    this.key = key;
    this.newer = this.older = null;

    this.update(value, size, maxAge);
  }

  update (value, size, maxAge) {
    this.value = value;
    this.size = size;
    this.maxAge = maxAge;
    this.now = maxAge ? Date.now() : null;
  }
}

class Documents {
  constructor (client) {
    this.client = client;

    this.lang = undefined;
    this.perPage = undefined;
    this.page = undefined;
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

  // deprecated
  with (field) {
    return this.include(field)
  }

  include(field) {
    this.includeQuery.push(field);

    return this
  }

  select (field) {
    this.selectQuery.push(field);

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
      lang: this.lang
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
    }, options);

    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'x-api-key': this.config.key
      }
    });

    this.http.interceptors.response.use((response) => {
      return response
    }, function (err) {
      return Promise.reject(err)
    });

    const cacheConfig = typeof this.config.cache === 'object' && this.config.cache ? this.config.cache : {};

    this.cache = new Cache({
      maxAge: typeof cacheConfig.maxAge === 'number' ? cacheConfig.maxAge : 30,
      maxSize: cacheConfig.maxSize || 3 * 1024 * 1024,
      maxLength: cacheConfig.maxLength || 1000
    });
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
        const responseData = err.response && err.response.data ? err.response.data : {};

        const info = {
          url: this.baseUrl + '/' + endpoint,
          code: err.response ? err.response.status : -1,
          params: options.params || {},
          method: options.method || 'GET',
          error: responseData.error || null,
          data: responseData
        };

        const message = responseData.error ? responseData.error.message : err.message;

        return Promise.reject(new APIError(message, info))
      })
  }

  cachedRequest (endpoint, options = {}) {
    if (!this.config.cache) {
      return this.request(endpoint, options)
    }

    const key = `${endpoint}:${JSON.stringify(options.params)}`;

    const cached = this.cache.get(key);

    if (cached instanceof Promise) {
      // the same request is being processed, so we wait for completion
      return cached.then(res => cloneObject(res.data))
    } else if (cached instanceof Error) {
      return Promise.reject(cached)
    } else if (typeof cached !== 'undefined') {
      return Promise.resolve(cloneObject(cached))
    }

    options.headers = options.headers || {};
    options.headers['x-cache'] = '1';

    const request = this.request(endpoint, options, true);

    this.cache.set(key, request, {
      size: 1
    });

    return request
      .then(res => {
        const size = Number(res.headers['content-length']) || 0;

        this.cache.set(key, res.data, {
          size
        });

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
