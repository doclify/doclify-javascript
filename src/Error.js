export default class APIError extends Error {
  constructor (message, info) {
    super(message) // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain

    this.info = info
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
    }

    return new APIError(err.message, info)
  }
}
