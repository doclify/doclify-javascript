/*!
  * @doclify/javascript v2.0.11
  * (c) 2020 Doclify
  * @license MIT
  */
import axios from 'axios';

var Cache = function Cache (options) {
  this.config = Object.assign({
    maxSize: Infinity,
    maxLength: Infinity,
    maxAge: 0,
    getSize: function getSize () {
      return 1
    }
  }, options || {});

  this.entries = new Map();
  this.size = 0;
  this.newest = this.oldest = undefined;
};

var prototypeAccessors = { length: { configurable: true } };

Cache.prototype.reset = function reset () {
  this.entries.clear();
  this.size = 0;
  this.newest = this.oldest = undefined;
};

prototypeAccessors.length.get = function () {
  return this.entries.size
};

Cache.prototype.has = function has (key) {
  return this.entries.has(key)
};

Cache.prototype.get = function get (key) {
  var entry = this.entries.get(key);

  if (!entry) {
    return
  }

  if (entry.maxAge && Date.now() - entry.now > entry.maxAge * 1000) {
    this.delete(entry);

    return
  }

  return entry.value
};

Cache.prototype.set = function set (key, value, options) {
    if ( options === void 0 ) options = {};

  var maxAge = options.maxAge || this.config.maxAge;

  if (maxAge && typeof maxAge !== 'number') {
    throw new TypeError('maxAge must be a number')
  }

  var size = typeof options.size === 'number' ? options.size : this.config.getSize(value, key);

  if (size > this.config.maxSize) {
    if (this.has(key)) {
      this.delete(key);
    }

    return false
  }

  var entry = this.entries.get(key);

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
};

Cache.prototype.markEntryAsUsed = function markEntryAsUsed (entry) {
  if (entry === this.newest) {
    // Already the most recenlty used entry, so no need to update the list
    return
  }

  // HEAD--------------TAIL
  // <.older .newer>
  //<--- add direction --
  // ABC<D>E
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
};

Cache.prototype.delete = function delete$1 (keyOrEntry) {
  var entry = keyOrEntry instanceof Entry ? keyOrEntry : this.entries.get(keyOrEntry);

  if (!entry) {
    return false
  }

  this.size -= entry.size;
  entry.size = 0;
  entry.newer = entry.older = undefined;

  return this.entries.delete(entry.key)
};

Cache.prototype.cleanup = function cleanup () {
  while (this.length > this.config.maxLength || this.size > this.config.maxSize) {
    if (!this.shift()) {
      break
    }
  }
};

Cache.prototype.shift = function shift () {
  var entry = this.oldest;

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
};

Object.defineProperties( Cache.prototype, prototypeAccessors );

var Entry = function Entry (key, value, size, maxAge) {
  this.key = key;
  this.newer = this.older = null;

  this.update(value, size, maxAge);
};

Entry.prototype.update = function update (value, size, maxAge) {
  this.value = value;
  this.size = size;
  this.maxAge = maxAge;
  this.now = maxAge ? Date.now() : null;
};

var Documents = function Documents (client) {
  this.client = client;

  this.lang = undefined;
  this.perPage = undefined;
  this.page = undefined;
  this.q = [];
  this.includeQuery = [];
  this.selectQuery = [];
  this.orderQuery = [];
};

Documents.prototype.where = function where (field, operator, value) {
  if (typeof value === 'undefined') {
    value = operator;
    operator = 'eq';
  }

  this.q.push([field, operator, value]);
  return this
};

Documents.prototype.collection = function collection (value) {
  return this.eq('sys.collection', value)
};

Documents.prototype.contentType = function contentType (value) {
  return this.eq('sys.contentType', value)
};

Documents.prototype.id = function id (value) {
  return this.eq('sys.id', value)
};

Documents.prototype.uid = function uid (value) {
  return this.eq('sys.uid', value)
};

Documents.prototype.eq = function eq (field, value) {
  return this.where(field, value)
};

Documents.prototype.not = function not (field, value) {
  return this.where(field, 'not', value)
};

Documents.prototype.in = function in$1 (field, value) {
  return this.where(field, 'in', value)
};

Documents.prototype.nin = function nin (field, value) {
  return this.where(field, 'nin', value)
};

Documents.prototype.gt = function gt (field, value) {
  return this.where(field, 'gt', value)
};

Documents.prototype.gte = function gte (field, value) {
  return this.where(field, 'gte', value)
};

Documents.prototype.lt = function lt (field, value) {
  return this.where(field, 'lt', value)
};

Documents.prototype.lte = function lte (field, value) {
  return this.where(field, 'lte', value)
};

Documents.prototype.fulltext = function fulltext (field, value) {
  return this.where(field, 'fulltext', value)
};

Documents.prototype.match = function match (field, value) {
  return this.where(field, 'match', value)
};

Documents.prototype.query = function query (query$1) {
  if (typeof query$1 !== 'function') {
    throw new TypeError('Query parameter must be function.')
  }

  query$1.call(this, this);

  return this
};

// deprecated
Documents.prototype.with = function with$1 (field) {
  return this.include(field)
};

Documents.prototype.include = function include () {
    var ref;

    var fields = [], len = arguments.length;
    while ( len-- ) fields[ len ] = arguments[ len ];
  if (fields.length && Array.isArray(fields[0])) {
    fields = fields[0];
  }

  (ref = this.includeQuery).push.apply(ref, fields);

  return this
};

Documents.prototype.select = function select () {
    var ref;

    var fields = [], len = arguments.length;
    while ( len-- ) fields[ len ] = arguments[ len ];
  if (fields.length && Array.isArray(fields[0])) {
    fields = fields[0];
  }
    
  (ref = this.selectQuery).push.apply(ref, fields);

  return this
};

Documents.prototype.orderBy = function orderBy (field, asc) {
  this.orderQuery.push([field, asc || 'asc']);

  return this
};

Documents.prototype.getParams = function getParams (params) {
    if ( params === void 0 ) params = {};

  return Object.assign({
    q: JSON.stringify(this.q),
    include: this.includeQuery.length ? JSON.stringify(this.includeQuery) : undefined,
    order: this.orderQuery.length ? JSON.stringify(this.orderQuery) : undefined,
    select: this.selectQuery.length ? JSON.stringify(this.selectQuery) : undefined,
    lang: this.lang
  }, params)
};

Documents.prototype.fetch = function fetch (limit) {
  return this.client.cachedRequest('documents/search', {
    params: this.getParams({
      limit: limit
    })
  })
};

// deprecated
Documents.prototype.paginated = function paginated (page, perPage) {
  return this.paginate(page, perPage)
};

Documents.prototype.paginate = function paginate (page, perPage) {
  return this.client.cachedRequest('documents/paginated', {
    params: this.getParams({
      perPage: perPage,
      page: page,
    })
  })
};

Documents.prototype.first = function first () {
  return this.client.cachedRequest('documents/single', {
    params: this.getParams()
  })
};

var APIError = /*@__PURE__*/(function (Error) {
  function APIError (message, info) {
    Error.call(this, message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain

    this.info = info;
  }

  if ( Error ) APIError.__proto__ = Error;
  APIError.prototype = Object.create( Error && Error.prototype );
  APIError.prototype.constructor = APIError;

  var prototypeAccessors = { url: { configurable: true },method: { configurable: true },code: { configurable: true },params: { configurable: true },error: { configurable: true },data: { configurable: true } };

  prototypeAccessors.url.get = function () {
    return this.info.url
  };

  prototypeAccessors.method.get = function () {
    return this.info.method.toUpperCase()
  };

  prototypeAccessors.code.get = function () {
    return ("" + (this.info.code || -1))
  };

  prototypeAccessors.params.get = function () {
    return this.info.params || {}
  };

  prototypeAccessors.error.get = function () {
    return this.info.error || null
  };

  prototypeAccessors.data.get = function () {
    return this.info.data || {}
  };

  APIError.prototype.toString = function toString () {
    return [
      'Doclify call failed:',
      ((this.method) + " " + (this.url) + " " + (JSON.stringify(this.params)) + " -"),
      this.message,
      ("(code " + (this.code) + ")")
    ].join(' ')
  };

  APIError.fromError = function fromError (err) {
    var info = {
      code: err.response ? err.response.status : null,
      url: err.request.url,
      method: err.request.method,
      data: err.response ? err.response.data : null
    };

    return new APIError(err.message, info)
  };

  Object.defineProperties( APIError.prototype, prototypeAccessors );

  return APIError;
}(Error));

function cloneObject(obj) {
  return JSON.parse(JSON.stringify(obj))
}

var Client = function Client (options) {
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

  this.http.interceptors.response.use(function (response) {
    return response
  }, function (err) {
    return Promise.reject(err)
  });

  var cacheConfig = typeof this.config.cache === 'object' && this.config.cache ? this.config.cache : {};

  this.cache = new Cache({
    maxAge: typeof cacheConfig.maxAge === 'number' ? cacheConfig.maxAge : 30,
    maxSize: cacheConfig.maxSize || 3 * 1024 * 1024,
    maxLength: cacheConfig.maxLength || 1000
  });
};

var prototypeAccessors$1 = { baseUrl: { configurable: true } };

prototypeAccessors$1.baseUrl.get = function () {
  return this.config.url || ("https://" + (this.config.repository) + ".cdn.doclify.io/api/v2")
};

Client.prototype.request = function request (endpoint, options, returnResponse) {
    var this$1 = this;
    if ( options === void 0 ) options = {};
    if ( returnResponse === void 0 ) returnResponse = false;

  return this.http.request(endpoint, options)
    .then(function (res) {
      return returnResponse ? res : res.data
    })
    .catch(function (err) {
      var responseData = err.response && err.response.data ? err.response.data : {};

      var info = {
        url: this$1.baseUrl + '/' + endpoint,
        code: err.response ? err.response.status : -1,
        params: options.params || {},
        method: options.method || 'GET',
        error: responseData.error || null,
        data: responseData
      };

      var message = responseData.error ? responseData.error.message : err.message;

      return Promise.reject(new APIError(message, info))
    })
};

Client.prototype.cachedRequest = function cachedRequest (endpoint, options) {
    var this$1 = this;
    if ( options === void 0 ) options = {};

  if (!this.config.cache) {
    return this.request(endpoint, options)
  }

  var key = endpoint + ":" + (JSON.stringify(options.params));

  var cached = this.cache.get(key);

  if (cached instanceof Promise) {
    // the same request is being processed, so we wait for completion
    return cached.then(function (res) { return cloneObject(res.data); })
  } else if (cached instanceof Error) {
    return Promise.reject(cached)
  } else if (typeof cached !== 'undefined') {
    return Promise.resolve(cloneObject(cached))
  }

  options.headers = options.headers || {};
  options.headers['x-cache'] = '1';

  var request = this.request(endpoint, options, true);

  this.cache.set(key, request, {
    size: 1
  });

  return request
    .then(function (res) {
      var size = Number(res.headers['content-length']) || 0;

      this$1.cache.set(key, res.data, {
        size: size
      });

      // return copy of data
      return cloneObject(res.data)
    }).catch(function (err) {
      this$1.cache.set(key, err);

      throw err
    })
};

Client.prototype.documents = function documents () {
  return new Documents(this)
};

Object.defineProperties( Client.prototype, prototypeAccessors$1 );

export default Client;
