export default class Documents {
  constructor (client) {
    this.client = client

    this.langCode = client.config.lang
    this.q = []
    this.includeQuery = []
    this.selectQuery = []
    this.orderQuery = []
  }

  where (field, operator, value) {
    if (typeof value === 'undefined') {
      value = operator
      operator = 'eq'
    }

    this.q.push([field, operator, value])
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

    query.call(this, this)

    return this
  }

  lang(lang) {
    this.langCode = lang

    return this
  }

  // deprecated
  with (field) {
    return this.include(field)
  }

  include(...fields) {
    if (fields.length && Array.isArray(fields[0])) {
      fields = fields[0]
    }

    this.includeQuery.push(...fields)

    return this
  }

  select (...fields) {
    if (fields.length && Array.isArray(fields[0])) {
      fields = fields[0]
    }
    
    this.selectQuery.push(...fields)

    return this
  }

  orderBy (field, asc) {
    this.orderQuery.push([field, asc || 'asc'])

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
