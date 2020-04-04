const doclify = require('./dist/doclify-javascript.min')

const client = doclify.createClient({
	repository: '0100conferences'
})

client.documents().fetch().then(res => console.log(res)).catch(err => console.log(err))