import Doclify from '../../../src/index'

describe("API", () => {
  beforeEach(function() {
    this.client = new Doclify({
      repository: process.env.REPOSITORY,
      key: process.env.API_KEY
    })
  })

  it("Creates a new instance without errors", function() {
    expect(() => new Doclify({
      repository: process.env.REPOSITORY,
      key: process.env.API_KEY
    })).not.toThrow()
  })

  it("Requires repository and api key", function() {
    expect(() => new Doclify({})).toThrow()
  })

  it("Sets correct API url", function() {
    expect(this.client.baseUrl)
    .toEqual(`https://${process.env.REPOSITORY}.cdn.doclify.io/api/v2`)
  })

  it("Allows you to set custom API url", () => {
    const url = 'https://api.dev'
    const client = new Doclify({
      url,
      key: process.env.API_KEY
    })

    expect(client.baseUrl).toEqual(url)
  })
})