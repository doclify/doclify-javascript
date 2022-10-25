const pick = function(attrs: Record<string, unknown>, allowed: string[]) {
  if (!attrs) {
    return null
  }

  const h: Record<string, unknown> = {}
  for (const key in attrs) {
    const value = attrs[key]
    if (allowed.indexOf(key) > -1 && value !== null) {
      h[key] = value
    }
  }

  return h
}

const isEmailLinkType = (type: string) => type === 'email'

const schema = {
  nodes: {
    horizontal_rule() {
      return {
        singleTag: 'hr'
      }
    },
    blockquote() {
      return {
        tag: 'blockquote'
      }
    },
    bullet_list() {
      return {
        tag: 'ul'
      }
    },
    code_block(node: any) {
      return {
        tag: [
          'pre',
          {
            tag: 'code',
            attrs: node.attrs
          }
        ]
      }
    },
    hard_break() {
      return {
        singleTag: 'br'
      }
    },
    heading(node: any) {
      return {
        tag: `h${node.attrs.level as string}`
      }
    },
    image(node: any) {
      return {
        singleTag: [{
          tag: 'img',
          attrs: pick(node.attrs as Record<string, unknown>, ['src', 'alt', 'title'])
        }]
      }
    },
    list_item() {
      return {
        tag: 'li'
      }
    },
    ordered_list() {
      return {
        tag: 'ol'
      }
    },
    paragraph() {
      return {
        tag: 'p'
      }
    },

    // tables
    table() {
      return {
        tag: [
          'table',
          'tbody',
        ]
      }
    },
    table_row() {
      return { tag: 'tr' }
    },
    table_header(node: any) {
      return {
        tag: [{ tag: 'th', attrs: node.attrs }]
      }
    },
    table_cell(node: any) {
      return {
        tag: [{ tag: 'td', attrs: node.attrs }]
      }
    }
  },
  marks: {
    bold() {
      return {
        tag: 'b'
      }
    },
    strike() {
      return {
        tag: 'strike'
      }
    },
    underline() {
      return {
        tag: 'u'
      }
    },
    strong() {
      return {
        tag: 'strong'
      }
    },
    code() {
      return {
        tag: 'code'
      }
    },
    italic() {
      return {
        tag: 'i'
      }
    },
    link(node: any) {
      const attrs = { ...node.attrs }
      const { linktype = 'url' } = node.attrs

      attrs.rel = 'noopener'

      if (isEmailLinkType(linktype as string)) {
        attrs.href = `mailto:${attrs.href as string}`
      }

      if (attrs.anchor) {
        attrs.href = `${attrs.href as string}#${attrs.anchor as string}`
        delete attrs.anchor
      }

      return {
        tag: [{
          tag: 'a',
          attrs: attrs
        }]
      }
    },
    styled(node: any) {
      return {
        tag: [{
          tag: 'span',
          attrs: node.attrs
        }]
      }
    }
  }
}

export default schema
