import Doclify from "../src";

describe("Creation of SDK instance", () => {
  test("Basic instance", () => {
    const doclify: any = new Doclify({
      url: 'http://doclify-test'
    });

    expect(doclify).toBeInstanceOf(Doclify);

    expect(Object.getOwnPropertyNames(Object.getPrototypeOf(doclify))).toEqual([
      "constructor",
      "baseUrl",
      "request",
      "documents"
    ]);

    expect(Object.getOwnPropertyNames(doclify)).toEqual([
      "options",
      "httpClient",
      "dom"
    ]);
  });
});
