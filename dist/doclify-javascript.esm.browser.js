/*!
  * @doclify/javascript v3.0.2
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

const matchHtmlRegExp = /["'&<>]/;

function cloneObject(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function escapeHtml(string) {
  var str = '' + string;
  var match = matchHtmlRegExp.exec(str);

  if (!match) {
    return str;
  }

  var escape;
  var html = '';
  var index = 0;
  var lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escape = '&quot;';
        break;
      case 38: // &
        escape = '&amp;';
        break;
      case 39: // '
        escape = '&#39;';
        break;
      case 60: // <
        escape = '&lt;';
        break;
      case 62: // >
        escape = '&gt;';
        break;
      default:
        continue;
    }

    if (lastIndex !== index) {
      html += str.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index
    ? html + str.substring(lastIndex, index)
    : html;
}

const serializers = {
	html: {
		doc({content}) {
			return this.serializeItems(content)
		},
		paragraph({content}) {
			return `<p>${this.serializeItems(content)}</p>`
		},
		heading({attrs, content}) {
			return `<h${attrs.level}>${this.serializeItems(content)}</h${attrs.level}>`
		},
		image({attrs}) {
			return `<p><img src="${attrs.url}"></p>`
		},
		text({text, marks}) {
			if (!marks) {
				return escapeHtml(text)
			}

			let html = escapeHtml(text);

			marks.forEach(({type, attrs}) => {
				if (type === 'bold') {
					html = `<strong>${html}</strong>`;
				} else if (type === 'italic') {
					html = `<em>${html}</em>`;
				} else if (type === 'underline') {
					html = `<span style="text-decoration:underline">${html}</span>`;
				} else if (type === 'link') {
					const target = attrs.target ? ` target="${attrs.target}" rel="noopener"` : '';
					html = `<a href="${attrs.href}"${target}>${html}</a>`;
				}
			});

			return html
		},
		bullet_list({content}) {
			return `<ul>${this.serializeItems(content)}</ul>`
		},
		ordered_list({content}) {
			return `<ol>${this.serializeItems(content)}</ol>`
		},
		list_item({content}) {
			return `<li>${this.serializeItems(content)}</li>`
		},
		hard_break() {
			return '<br>'
		},
		table({content}) {
			return `<table><tbody>${this.serializeItems(content)}</tbody></table>`
		},
		table_row({content}) {
			return `<tr>${this.serializeItems(content)}</tr>`
		},
		table_header(props) {
			return serializers.html.table_cell.call(this, props, 'th')
		},
		table_cell({attrs, content}, tag = 'td') {
			const attrString = Object.keys(attrs).map(attr => {
				let value = attrs[attr];
				if (!value) {
					return
				}

				// colwidth can be array
				if (Array.isArray(value)) {
					value = value.join(',');
				}

				return `${attr}="${value}"`
			}).filter(item => item).join(' ');
			return `<${tag} ${attrString}>${this.serializeItems(content)}</${tag}>`
		}
	}
};

class Serializer {
	constructor(type, serializers) {
		this.type = type || 'html';
		this.serializers = serializers || {};
	}

	serializeItems(items) {
		return (items || []).map(item => this.serialize(item)).join('')
	}

	serialize(obj) {
		if (!obj) {
			return ''
		}

		let serializer = this.serializers[obj.type]; 
		
		if (!serializer && serializers[this.type]) {
			serializer = serializers[this.type][obj.type];
		}

		if (!serializer) {
			// eslint-disable-next-line no-console, no-undef
			console.warn(`[@doclify/javascript] Invalid structuredText type '${obj.type}', please try upgrading @doclify/javascript.`);

			return ''
		}

		return serializer.call(this, obj)
	}
}

const defaultSerializer = new Serializer();

function asHtml(json) {
	return defaultSerializer.serialize(json)
}

var structuredText = {
	asHtml,
	Serializer
};



var dom = /*#__PURE__*/Object.freeze({
  __proto__: null,
  structuredText: structuredText
});

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

    this.dom = dom;
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
export { dom };
