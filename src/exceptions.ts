export class DoclifyException extends Error {
  isDoclify: boolean
  status: number
  data: any

  constructor(message: string, status?: number, data?: any) {
    if (typeof status === 'undefined') {
      status = -1
    }

    if (status >= 500) {
      message = 'Unknown error occurred, please try again later.'
    } else if (data && data.error) {
      message = data.error.message
    } else if (Array.isArray(data)) {
      message = 'Validation failed. Please verify your paramaters.'
    }

    super(message)

    this.isDoclify = true
    this.status = status
    this.data = data

    Object.setPrototypeOf(this, new.target.prototype)
  }

  get isValidationError(): boolean {
    return Array.isArray(this.data?.errors)
  }

  get validationErrors(): any[] {
    return this.data?.errors ?? []
  }

  get statusCode(): number {
    return this.status
  }

  get code(): string | undefined {
    return this.data?.error?.code
  }

  toJSON(): Record<string, any> {
    return {
      message: this.message,
      status: this.status,
      code: this.code,
      data: this.data,
    }
  }

  static fromJSON(json: Record<string, unknown>): DoclifyException {
    return new DoclifyException(json.message as string, json.status as number, json.data)
  }

  static fromResponse(response: Response, data: any): DoclifyException {
    return new DoclifyException('Invalid request.', response.status, data)
  }
}
