import Doclify from '@doclify/javascript'

const client = new Doclify({
  repository: process.env.REPOSITORY,
  key: process.env.API_KEY,
  cache: {
    maxAge: 3,
    maxLength: 3
  },
})

const request = (limit = 2) => {
  return client.documents()
    .collection('pages')
    .fetch(limit)
    .then(data => console.log('data', data))
    .catch(err => console.error(err))
}


request()

request(3)

setTimeout(request, 0)

setTimeout(() => {
  request()

  request(4)

  request(5)
}, 1500)

setTimeout(() => {
  request()
}, 5000)