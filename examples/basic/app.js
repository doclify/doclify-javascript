import Doclify from '@doclify/javascript'

const client = new Doclify({
  repository: process.env.REPOSITORY,
  key: process.env.API_KEY
})

client.documents()
  .collection('pages')
  .fetch(2)
  .then(data => console.log('data', data))
  .catch(err => console.log(err.toString()))
