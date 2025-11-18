import type Doclify from './Doclify.js'
import { DoclifyException } from './exceptions.js'

type Operator = 'eq' | 'not' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte' | 'fulltext' | 'match'
type QueryValue = string | number | boolean
type QueryItem = [string, Operator, QueryValue | QueryValue[]]
type OrderAsc = 'asc' | 'desc'
type Order = [string, OrderAsc]

export default class Documents {
  private _lang?: string
  private _limit?: number
  private _offset?: number
  private _include: string[] = []
  private _select: string[] = []
  private _order: Order[] = []
  private q: QueryItem[] = []

  constructor(private client: Doclify) {
    if (client.options.language) {
      this._lang = client.options.language
    }
  }

  where(field: string, operator: Operator, value: QueryValue | QueryValue[]): this {
    this.q.push([field, operator, value])

    return this
  }

  collection(value: string): this {
    return this.eq('sys.collection', value)
  }

  contentType(value: string): this {
    return this.eq('sys.contentType', value)
  }

  id(value: string): this {
    return this.eq('sys.id', value)
  }

  uid(value: string): this {
    return this.eq('sys.uid', value)
  }

  eq(field: string, value: QueryValue): this {
    return this.where(field, 'eq', value)
  }

  not(field: string, value: QueryValue): this {
    return this.where(field, 'not', value)
  }

  in(field: string, value: QueryValue[]): this {
    return this.where(field, 'in', value)
  }

  nin(field: string, value: QueryValue[]): this {
    return this.where(field, 'nin', value)
  }

  gt(field: string, value: number): this {
    return this.where(field, 'gt', value)
  }

  gte(field: string, value: number): this {
    return this.where(field, 'gte', value)
  }

  lt(field: string, value: number): this {
    return this.where(field, 'lt', value)
  }

  lte(field: string, value: number): this {
    return this.where(field, 'lte', value)
  }

  fulltext(field: string, value: string): this {
    return this.where(field, 'fulltext', value)
  }

  match(field: string, value: string): this {
    return this.where(field, 'match', value)
  }

  query(query: (query: Documents) => void): this {
    query(this)

    return this
  }

  language(lang: string): this {
    this._lang = lang

    return this
  }

  limit(limit: number): this {
    this._limit = limit

    return this
  }

  offset(offset: number): this {
    this._offset = offset

    return this
  }

  include(fields: string[]): this {
    this._include.push(...fields)

    return this
  }

  select(fields: string[]): this {
    this._select.push(...fields)

    return this
  }

  orderBy(field: string, asc: 'asc' | 'desc' = 'asc'): this {
    this._order.push([field, asc])

    return this
  }

  getParams(params = {}): Record<string, any> {
    return Object.assign(
      {
        q: JSON.stringify(this.q),
        include: this._include.length ? JSON.stringify(this._include) : undefined,
        order: this._order.length ? JSON.stringify(this._order) : undefined,
        select: this._select.length ? JSON.stringify(this._select) : undefined,
        lang: this._lang,
        limit: this._limit,
        offset: this._offset,
      },
      params,
    )
  }

  fetch(): Promise<any> {
    return this.client.request('documents/search', {
      params: this.getParams(),
    })
  }

  paginate(page: number, perPage: number): Promise<any> {
    return this.client.request('documents/paginated', {
      params: this.getParams({
        perPage,
        page,
      }),
    })
  }

  async first(): Promise<any> {
    const results = await this.client.request('documents/search', {
      params: this.getParams({
        limit: 1,
      }),
    })

    return results.length ? results[0] : null
  }

  async firstOrFail(): Promise<any> {
    const results = await this.client.request('documents/search', {
      params: this.getParams({
        limit: 1,
      }),
    })

    if (!results.length) {
      throw new DoclifyException('Document was not found.', 404)
    }

    return results[0]
  }

  then(resolve: (value: any) => any, reject?: (value: any) => any): any {
    return this.fetch()
      .then(resolve, reject)
  }
}
