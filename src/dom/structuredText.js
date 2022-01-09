import { escapeHtml } from '../utils'

const serializers = {
	html: {
		doc({content}) {
			return this.serializeItems(content)
		},
		paragraph({content}) {
			return `<p>${this.serializeItems(content)}</p>`
		},
		heading({attrs, content}) {
			return `<h${attrs.level}>${this.serializeItems(content)}</h${attrs.level}>`
		},
		image({attrs}) {
			return `<p><img src="${attrs.url}"></p>`
		},
		text({text, marks}) {
			if (!marks) {
				return escapeHtml(text)
			}

			let html = escapeHtml(text)

			marks.forEach(({type, attrs}) => {
				if (type === 'bold') {
					html = `<strong>${html}</strong>`
				} else if (type === 'italic') {
					html = `<em>${html}</em>`
				} else if (type === 'underline') {
					html = `<span style="text-decoration:underline">${html}</span>`
				} else if (type === 'link') {
					const target = attrs.target ? ` target="${attrs.target}" rel="noopener"` : ''
					html = `<a href="${attrs.href}"${target}>${html}</a>`
				} else if (type === 'superscript') {
					html = `<sup>${html}</sup>`
				} else if (type === 'subscript') {
					html = `<sub>${html}</sub>`
				}
			})

			return html
		},
		bullet_list({content}) {
			return `<ul>${this.serializeItems(content)}</ul>`
		},
		ordered_list({content}) {
			return `<ol>${this.serializeItems(content)}</ol>`
		},
		list_item({content}) {
			return `<li>${this.serializeItems(content)}</li>`
		},
		hard_break() {
			return '<br>'
		},
		table({content}) {
			return `<table><tbody>${this.serializeItems(content)}</tbody></table>`
		},
		table_row({content}) {
			return `<tr>${this.serializeItems(content)}</tr>`
		},
		table_header(props) {
			return serializers.html.table_cell.call(this, props, 'th')
		},
		table_cell({attrs, content}, tag = 'td') {
			const attrString = Object.keys(attrs).map(attr => {
				let value = attrs[attr]
				if (!value) {
					return
				}

				// colwidth can be array
				if (Array.isArray(value)) {
					value = value.join(',')
				}

				return `${attr}="${value}"`
			}).filter(item => item).join(' ')
			return `<${tag} ${attrString}>${this.serializeItems(content)}</${tag}>`
		}
	}
}

class Serializer {
	constructor(type, serializers) {
		this.type = type || 'html'
		this.serializers = serializers || {}
	}

	serializeItems(items) {
		return (items || []).map(item => this.serialize(item)).join('')
	}

	serialize(obj) {
		if (!obj) {
			return ''
		}

		let serializer = this.serializers[obj.type] 
		
		if (!serializer && serializers[this.type]) {
			serializer = serializers[this.type][obj.type]
		}

		if (!serializer) {
			// eslint-disable-next-line no-console, no-undef
			console.warn(`[@doclify/javascript] Invalid structuredText type '${obj.type}', please try upgrading @doclify/javascript.`)

			return ''
		}

		return serializer.call(this, obj)
	}
}

const defaultSerializer = new Serializer()

function asHtml(json) {
	return defaultSerializer.serialize(json)
}

export default {
	asHtml,
	Serializer
}