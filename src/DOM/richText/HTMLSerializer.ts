import { escapeHTML } from '../../utils.js'
import defaultSchema from './schema.js'

type NodeSerializer = (node: any) => any
type MarkSerializer = (node: any) => any

interface Schema {
  nodes: Record<string, NodeSerializer>
  marks: Record<string, MarkSerializer>
}

export default class HTMLSerializer {
  private nodes: Record<string, NodeSerializer> = {}
  private marks: Record<string, MarkSerializer> = {}

  constructor(schema: Schema = defaultSchema) {
    this.marks = schema.marks
    this.nodes = schema.nodes
  }

  addNode(key: string, schema: NodeSerializer) {
    this.nodes[key] = schema
  }

  addMark(key: string, schema: MarkSerializer) {
    this.marks[key] = schema
  }

  render(data?: any) {
    if (!data) {
      return ''
    }

    if (data.content && Array.isArray(data.content)) {
      const html: string[] = []

      data.content.forEach((node: any) => {
        html.push(this.renderNode(node))
      })

      return html.join('')
    }

    console.warn('The render method must receive an object with a content field, which is an array')
    return ''
  }

  renderNode(item: any) {
    const html = []

    if (item.marks) {
      item.marks.forEach((m: any) => {
        const mark = this.getMatchingMark(m)

        if (mark) {
          html.push(this.renderOpeningTag(mark.tag))
        }
      })
    }

    const node = this.getMatchingNode(item)

    if (node && node.tag) {
      html.push(this.renderOpeningTag(node.tag))
    }

    if (item.content) {
      item.content.forEach((content: any) => {
        html.push(this.renderNode(content))
      })
    } else if (item.text) {
      html.push(escapeHTML(item.text as string))
    } else if (node && node.singleTag) {
      html.push(this.renderTag(node.singleTag, ' /'))
    } else if (node && node.html) {
      html.push(node.html)
    }

    if (node && node.tag) {
      html.push(this.renderClosingTag(node.tag))
    }

    if (item.marks) {
      item.marks.slice(0)
        .reverse()
        .forEach((m: any) => {
          const mark = this.getMatchingMark(m)

          if (mark) {
            html.push(this.renderClosingTag(mark.tag))
          }
        })
    }

    return html.join('')
  }

  renderTag(tags: any, ending: string) {
    if (tags.constructor === String) {
      return `<${tags as string}${ending}>`
    }

    const all = tags.map((tag: any) => {
      if (tag.constructor === String) {
        return `<${tag as string}${ending}>`
      } else {
        let h = `<${tag.tag as string}`
        if (tag.attrs) {
          for (const key in tag.attrs) {
            const value = tag.attrs[key]
            if (value !== null) {
              h += ` ${key}="${value as string}"`
            }
          }
        }

        return `${h}${ending}>`
      }
    })
    return all.join('')
  }

  renderOpeningTag(tags: any) {
    return this.renderTag(tags, '')
  }

  renderClosingTag(tags: any) {
    if (tags.constructor === String) {
      return `</${tags as string}>`
    }

    const all = tags.slice(0)
      .reverse()
      .map((tag: any) => {
        if (tag.constructor === String) {
          return `</${tag as string}>`
        } else {
          return `</${tag.tag as string}>`
        }
      })

    return all.join('')
  }

  getMatchingNode(item: any) {
    if (typeof this.nodes[item.type] !== 'function') {
      return
    }
    return this.nodes[item.type](item)
  }

  getMatchingMark(item: any) {
    if (typeof this.marks[item.type] !== 'function') {
      return
    }
    return this.marks[item.type](item)
  }
}
