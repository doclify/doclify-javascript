import defu from 'defu'

import { DoclifyException } from './exceptions.js'
import Documents from './Documents.js'
import * as DOM from './DOM/index.js'

// Load custom types
import type {
  DoclifyDefaultOptions,
  DoclifyOptions,
} from './types.js'

const defaults: DoclifyDefaultOptions = {
  timeout: 5000,
}

export default class Doclify {
  options: DoclifyDefaultOptions
  dom = DOM
  private fetch: typeof fetch

  constructor(options: DoclifyOptions = {}) {
    this.options = defu((options as DoclifyDefaultOptions) || {}, defaults)

    if (!this.options.url) {
      if (!this.options.repository) {
        throw new TypeError('Repository or URL option is required.')
      }

      if (!this.options.key) {
        throw new TypeError('API key is required.')
      }
    }

    if (typeof options.fetch === 'function') {
      this.fetch = options.fetch
    } else if (typeof globalThis.fetch === 'function') {
      this.fetch = globalThis.fetch
    } else {
      throw new DoclifyException(
        'A valid fetch implementation was not provided. In environments where fetch is not available (including Node.js), a fetch implementation must be provided via a polyfill or the `fetch` option.',
      )
    }

    if (this.fetch === globalThis.fetch) {
      this.fetch = this.fetch.bind(globalThis)
    }
  }

  get baseUrl(): string {
    return this.options.url || `https://${this.options.repository ?? ''}.cdn.doclify.io/api/v2`
  }

  async request(
    endpoint: string,
    options: Record<string, any> = {},
  ): Promise<any> {
    options.headers = options.headers || {}
    options.params = options.params || {}

    if (this.options.key) {
      options.headers.Authorization = 'Bearer ' + this.options.key
    }

    if (this.options.language && !options.params.lang) {
      options.params.lang = this.options.language
    }

    const searchParams = new URLSearchParams()
    for (const key in options.params) {
      if (options.params[key]) {
        searchParams.append(key, String(options.params[key]))
      }
    }

    delete options.params

    const query = searchParams.toString()

    let response: Response

    try {
      response = await this.fetch(this.baseUrl + '/' + endpoint + (query ? '?' + query : ''), options)
    } catch (err) {
      throw new DoclifyException('Networking issue: ' + (err as Error).message, 500)
    }

    const json = await response.json()

    if (!response.ok) {
      throw DoclifyException.fromResponse(response, json)
    }

    return json
  }

  documents(): Documents {
    return new Documents(this)
  }
}
