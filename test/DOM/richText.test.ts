import * as richText from "../../src/DOM/richText";

describe("richText", () => {
  test("serialize", () => {
    const doc = {
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": {
            "level": 1
          },
          "content": [
            {
              "text": "Bold text",
              "type": "text",
              "marks": [
                {
                  "type": "bold"
                }
              ]
            },
            {
              "text": " normal text",
              "type": "text"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "text": "Another paragraph.",
              "type": "text"
            }
          ]
        }
      ]
    }

    const html = richText.asHTML(doc)

    expect(html).toEqual('<h1><b>Bold text</b> normal text</h1><p>Another paragraph.</p>')
  });
});
