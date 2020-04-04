/*!
  * @doclify/javascript v1.1.0
  * (c) 2020 Doclify
  * @license MIT
  */
import axios from 'axios';

class Cache {
  constructor(options) {
    this.config = Object.assign({
      maxSize: Infinity,
      maxItems: Infinity,
      maxAge: 0,
      getLength() {
        return 1
      }
    }, options || {});

    this.reset();
  }

  reset() {
    this.entries = new Map();
    this.length = 0;
    this.size = 0;
  }

  get(key) {
    const entry = this.entries.get(key);

    if (!entry) {
      return
    }

    if (this.config.maxAge && Date.now() - entry.now > this.config.maxAge) {
      this.delete(key);

      return
    }
  }
}

class Documents {
	constructor(client) {
		this.client = client;

		this.lang = undefined;
		this.perPage = undefined;
		this.page = undefined;
		this.q = [];
		this.withLazy = [];
		this.order = [];
	}

	where(field, operator, value) {
		if (typeof value === 'undefined') {
			value = operator;
			operator = 'eq';
		}

		this.q.push([field, operator, value]);
		return this
	}

	collection(value) {
		return this.eq('sys.collection', value)
	}

	contentType(value) {
		return this.eq('sys.contentType', value)
	}

	id(value) {
		return this.eq('sys.id', value)
	}

	uid(value) {
		return this.eq('sys.uid', value)
	}

	eq(field, value) {
		return this.where(field, value)
	}

	not(field, value) {
		return this.where(field, 'not', value)
	}

	in(field, value) {
		return this.where(field, 'in', value)
	}

	nin(field, value) {
		return this.where(field, 'nin', value)
	}

	gt(field, value) {
		return this.where(field, 'gt', value)
	}

	gte(field, value) {
		return this.where(field, 'gte', value)
	}

	lt(field, value) {
		return this.where(field, 'lt', value)
	}

	lte(field, value) {
		return this.where(field, 'lte', value)
	}

	fulltext(field, value) {
		return this.where(field, 'fulltext', value)
	}

	match(field, value) {
		return this.where(field, 'match', value)
	}

	with(lazyField) {
		this.withLazy.push(lazyField);

		return this
	}

	orderBy(field, asc) {
		this.order.push([field, asc || 'asc']);

		return this
	}

	fetch(limit) {
		return this.client.cachedRequest('documents/search', {
			params: {
				q: JSON.stringify(this.q),
				with: this.withLazy.length ? JSON.stringify(this.withLazy) : undefined,
				order: this.order.length ? JSON.stringify(this.order) : undefined,
				limit,
				lang: this.lang
			}
		})
	}

	paginated(page, perPage) {
		return this.client.cachedRequest('documents/paginated', {
			params: {
				q: JSON.stringify(this.q),
				with: this.withLazy.length ? JSON.stringify(this.withLazy) : undefined,
				order: this.order.length ? JSON.stringify(this.order) : undefined,
				perPage,
				page,
				lang: this.lang
			}
		})
	}

	first() {
		return this.client.cachedRequest('documents/single', {
			q: JSON.stringify(this.q),
			with: this.withLazy.length ? JSON.stringify(this.withLazy) : undefined,
			order: this.order.length ? JSON.stringify(this.order) : undefined,
			lang: this.lang
		})
	}
}

class Client {
	constructor(options) {
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
	
		this.http.interceptors.response.use((response) => {
			return response.data
		}, function (error) {
			console.log('err', err.response);

			return Promise.reject(error)
		});

		const cacheConfig = typeof this.config.cache === 'object' && this.config.cache ? this.config.cache : {};
		
		this.cache = new Cache({
			maxAge: typeof cacheConfig.maxAge === 'number' ? cacheConfig.maxAge : 30,
			maxSize: cacheConfig.maxSize || 3 * 1024 * 1024,
			maxItems: cacheConfig.maxItems || 1000,
			getLength(n, key) {
				console.log('n', n);
				return n * 2 + key.length
			}
		});
	}

	get baseUrl() {
		return this.config.url || `https://${this.config.repository}.cdn.doclify.io/api/v2`
	}

	request(endpoint, options) {
		return this.http.request(endpoint, options)
	}

	cachedRequest(endpoint, options = {}) {
		if (!this.config.cache) {
			return this.request(endpoint, options)
		}

		const key = `${endpoint}:${JSON.stringify(options.params)}`;

		const cached = this.cache.get(key);

		if (cached instanceof Promise) {
			return cached
		} else if (cached instanceof Error) {
			return Promise.reject(cached)
		} else if (typeof cached !== 'undefined') {
			return Promise.resolve(cached)
		}

		const request = this.request(endpoint, options);

		this.cache.set(key, request);

		return request
			.then(data => {
				this.cache.set(key, data);

				return data
			}).catch(err => {
				this.cache.set(key, err);

				throw err
			})
	}

	documents() {
		return new Documents(this)
	}
}

export default Client;
