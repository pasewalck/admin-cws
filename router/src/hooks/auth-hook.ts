import { FastifyInstance } from "fastify";
import { getApiTokenByKey } from "../service/persistence";

declare module 'fastify' {
    interface FastifyRequest {
        apiToken: string
        apiTokenId: string
    }
}

export default function (fastify: FastifyInstance) {
    fastify.addHook('preHandler', async (request, reply) => {
        const key = request.headers['x-api-key'] as string | undefined

        if (!key) {
            return reply.code(401).send({ error: 'API key is missing' })
        }

        const apiTokenEntry = await getApiTokenByKey(key);

        if (!apiTokenEntry) {
            return reply.code(401).send({ error: 'Invalid API key' })
        }

        request.apiTokenId = apiTokenEntry.id
        request.apiToken = apiTokenEntry.token

    })

}