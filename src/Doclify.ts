// Module dependencies & types
import axios, {
  AxiosError,
  AxiosInstance
} from "axios";
import defu from "defu";

import { DoclifyException } from './exceptions'
import Documents from './Documents'
import * as DOM from './DOM'


// Load custom types
import type {
  DoclifyDefaultOptions,
  DoclifyOptions,
} from "./types";

const defaults: DoclifyDefaultOptions = {
  timeout: 5000,
};

export default class Doclify {
  public options: DoclifyDefaultOptions
  public httpClient: AxiosInstance
  public dom = DOM

  constructor(options?: DoclifyOptions) {
    this.options = defu((options as DoclifyDefaultOptions) || {}, defaults)

    if (!this.options.url) {
      if (!this.options.repository) {
        throw new TypeError('Repository or URL option is required.')
      }

      if (!this.options.key) {
        throw new TypeError('API key is required.')
      }
    }

    const headers: Record<string, string> = {}

    if (this.options.key) {
      headers.Authorization = 'Bearer ' + this.options.key
    }

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: this.options.timeout,
      headers,
    })

    this.httpClient.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return Promise.reject(DoclifyException.fromAxiosError(error))
      }
    )
  }

  public get baseUrl(): string {
    return this.options.url || `https://${this.options.repository ?? ''}.cdn.doclify.io/api/v2`
  }

  public async request<T = any>(
    endpoint: string,
    options: Record<string, any> = {}
  ): Promise<any> {
    options.url = endpoint
    options.params = options.params || {}

    if (this.options.language && !options.params.lang) {
      options.params.lang = this.options.language
    }

    const response = await this.httpClient.request<T>(options)

    return response.data
  }

  public documents(): Documents {
    return new Documents(this)
  }
}
