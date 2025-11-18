export function cloneObject(obj: any): any {
  return JSON.parse(JSON.stringify(obj))
}

export const escapeHTML = function (text: string) {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
  }

  const reUnescapedHtml = /[&<>"']/g
  const reHasUnescapedHtml = RegExp(reUnescapedHtml.source)

  if (text && reHasUnescapedHtml.test(text)) {
    return text.replace(reUnescapedHtml, (chr) => htmlEscapes[chr]!)
  }

  return text
}
