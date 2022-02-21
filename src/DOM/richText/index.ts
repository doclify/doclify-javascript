import HTMLSerializer from './HTMLSerializer'

const defaultSerializer = new HTMLSerializer()
const asHTML = (doc: any) => {
  return defaultSerializer.render(doc)
}

export {
  HTMLSerializer,
  defaultSerializer,
  asHTML
}
