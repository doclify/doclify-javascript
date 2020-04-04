export default class Documents {
  constructor (client) {
    this.client = client

    this.lang = undefined
    this.perPage = undefined
    this.page = undefined
    this.q = []
    this.withLazy = []
    this.order = []
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

  with (lazyField) {
    this.withLazy.push(lazyField)

    return this
  }

  orderBy (field, asc) {
    this.order.push([field, asc || 'asc'])

    return this
  }

  fetch (limit) {
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

  paginated (page, perPage) {
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

  first () {
    return this.client.cachedRequest('documents/single', {
      params: {
        q: JSON.stringify(this.q),
        with: this.withLazy.length ? JSON.stringify(this.withLazy) : undefined,
        order: this.order.length ? JSON.stringify(this.order) : undefined,
        lang: this.lang
      }
    })
  }
}
