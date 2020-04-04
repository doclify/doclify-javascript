/*!
  * @doclify/javascript v1.1.0
  * (c) 2020 Doclify
  * @license MIT
  */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('axios')) :
  typeof define === 'function' && define.amd ? define(['axios'], factory) :
  (global = global || self, global.DoclifyJS = factory(global.axios));
}(this, (function (axios) { 'use strict';

  axios = axios && Object.prototype.hasOwnProperty.call(axios, 'default') ? axios['default'] : axios;

  var Cache = function Cache(options) {
    this.config = Object.assign({
      maxSize: Infinity,
      maxItems: Infinity,
      maxAge: 0,
      getLength: function getLength() {
        return 1
      }
    }, options || {});

    this.reset();
  };

  Cache.prototype.reset = function reset () {
    this.entries = new Map();
    this.length = 0;
    this.size = 0;
  };

  Cache.prototype.get = function get (key) {
    var entry = this.entries.get(key);

    if (!entry) {
      return
    }

    if (this.config.maxAge && Date.now() - entry.now > this.config.maxAge) {
      this.delete(key);

      return
    }
  };

  var Documents = function Documents(client) {
  	this.client = client;

  	this.lang = undefined;
  	this.perPage = undefined;
  	this.page = undefined;
  	this.q = [];
  	this.withLazy = [];
  	this.order = [];
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

  Documents.prototype.with = function with$1 (lazyField) {
  	this.withLazy.push(lazyField);

  	return this
  };

  Documents.prototype.orderBy = function orderBy (field, asc) {
  	this.order.push([field, asc || 'asc']);

  	return this
  };

  Documents.prototype.fetch = function fetch (limit) {
  	return this.client.cachedRequest('documents/search', {
  		params: {
  			q: JSON.stringify(this.q),
  			with: this.withLazy.length ? JSON.stringify(this.withLazy) : undefined,
  			order: this.order.length ? JSON.stringify(this.order) : undefined,
  			limit: limit,
  			lang: this.lang
  		}
  	})
  };

  Documents.prototype.paginated = function paginated (page, perPage) {
  	return this.client.cachedRequest('documents/paginated', {
  		params: {
  			q: JSON.stringify(this.q),
  			with: this.withLazy.length ? JSON.stringify(this.withLazy) : undefined,
  			order: this.order.length ? JSON.stringify(this.order) : undefined,
  			perPage: perPage,
  			page: page,
  			lang: this.lang
  		}
  	})
  };

  Documents.prototype.first = function first () {
  	return this.client.cachedRequest('documents/single', {
  		q: JSON.stringify(this.q),
  		with: this.withLazy.length ? JSON.stringify(this.withLazy) : undefined,
  		order: this.order.length ? JSON.stringify(this.order) : undefined,
  		lang: this.lang
  	})
  };

  var Client = function Client(options) {
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
  	}, options);

  	this.http = axios.create({
  		baseURL: this.baseUrl,
  		headers: {
  			'x-api-key': this.config.key
  		}
  	});
  	
  	this.http.interceptors.response.use(function (response) {
  		return response.data
  	}, function (error) {
  		console.log('err', err.response);

  		return Promise.reject(error)
  	});

  	var cacheConfig = typeof this.config.cache === 'object' && this.config.cache ? this.config.cache : {};
  		
  	this.cache = new Cache({
  		maxAge: typeof cacheConfig.maxAge === 'number' ? cacheConfig.maxAge : 30,
  		maxSize: cacheConfig.maxSize || 3 * 1024 * 1024,
  		maxItems: cacheConfig.maxItems || 1000,
  		getLength: function getLength(n, key) {
  			console.log('n', n);
  			return n * 2 + key.length
  		}
  	});
  };

  var prototypeAccessors = { baseUrl: { configurable: true } };

  prototypeAccessors.baseUrl.get = function () {
  	return this.config.url || ("https://" + (this.config.repository) + ".cdn.doclify.io/api/v2")
  };

  Client.prototype.request = function request (endpoint, options) {
  	return this.http.request(endpoint, options)
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
  		return cached
  	} else if (cached instanceof Error) {
  		return Promise.reject(cached)
  	} else if (typeof cached !== 'undefined') {
  		return Promise.resolve(cached)
  	}

  	var request = this.request(endpoint, options);

  	this.cache.set(key, request);

  	return request
  		.then(function (data) {
  			this$1.cache.set(key, data);

  			return data
  		}).catch(function (err) {
  			this$1.cache.set(key, err);

  			throw err
  		})
  };

  Client.prototype.documents = function documents () {
  	return new Documents(this)
  };

  Object.defineProperties( Client.prototype, prototypeAccessors );

  return Client;

})));
