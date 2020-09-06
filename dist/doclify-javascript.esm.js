/*!
  * @doclify/javascript v3.0.1
  * (c) 2020 Doclify
  * @license MIT
  */
import axios from 'axios';

var Documents = function Documents (client) {
  this.client = client;

  this.langCode = client.config.lang;
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

Documents.prototype.lang = function lang (lang$1) {
  this.langCode = lang$1;

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
    lang: this.langCode
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
  if ( options === void 0 ) options = {};

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

  var headers = {};

  if (this.config.token) {
    headers.Authorization = 'Bearer ' + this.config.token;
  }

  this.http = axios.create({
    baseURL: this.baseUrl,
    timeout: this.config.timeout,
    headers: headers
  });

  this.http.interceptors.response.use(function (response) {
    return response
  }, function (err) {
    return Promise.reject(err)
  });
};

var prototypeAccessors = { baseUrl: { configurable: true } };

prototypeAccessors.baseUrl.get = function () {
  return this.config.url || ("https://" + (this.config.repository) + ".cdn.doclify.io/api/v2")
};

Client.prototype.setCache = function setCache (cache) {
  this.cache = cache;
};

Client.prototype.setLang = function setLang (lang) {
  this.config.lang = lang;
};

Client.prototype.getCacheKey = function getCacheKey (endpoint, params) {
  var paramsArray = [];

  Object.keys(params).sort().forEach(function (key) {
    paramsArray.push((key + "=" + (params[key])));
  });

  return (endpoint + "?" + (paramsArray.join('&')))
};

Client.prototype.request = function request (endpoint, options, returnResponse) {
    var this$1 = this;
    if ( options === void 0 ) options = {};
    if ( returnResponse === void 0 ) returnResponse = false;

  options.params = options.params || {};
    
  if (this.config.lang && !options.params.lang) {
    options.params.lang = this.config.lang;
  }

  return this.http.request(endpoint, options)
    .then(function (res) {
      return returnResponse ? res : res.data
    })
    .catch(function (err) {
      var responseData = err.response && err.response.data ? err.response.data : {};

      var info = {
        url: this$1.baseUrl + '/' + endpoint,
        code: err.response ? err.response.status : -1,
        params: options.params,
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

  if (!this.cache) {
    return this.request(endpoint, options)
  }

  var key = this.getCacheKey(endpoint, options.params || {});

  var cache = this.cache.get(key);

  if (cache instanceof Promise) {
    // the same request is being processed, so we wait for completion
    return cache.then(function (res) { return cloneObject(res.data); })
  } else if (cache instanceof Error) {
    return Promise.reject(cache)
  } else if (typeof cache !== 'undefined') {
    return Promise.resolve(cloneObject(cache))
  }

  var request = this.request(endpoint, options, true);

  this.cache.set(key, request);

  return request
    .then(function (res) {
      this$1.cache.set(key, res.data);

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

Object.defineProperties( Client.prototype, prototypeAccessors );

export default Client;
