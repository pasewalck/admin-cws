import Fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import authHook from './hooks/auth-hook'
import api from './routes/api'

const fastify = Fastify({
    logger: true
})

async function main() {

    await fastify.register(fastifyCors)
    fastify.decorateRequest('apiKey', null)

    authHook(fastify)
    api(fastify)

    fastify.listen({ port: 3000 }, (err, address) => {
        if (err) throw err
    })
}

main()