import { FastifyInstance } from 'fastify';
import { executeCommand } from '../service/ssh';
import { isServerAccessible, getServersByToken } from '../service/persistence';

declare module 'fastify' {
    interface FastifyRequest {
        apiToken: string
        apiTokenId: string
    }
}

export default async function (fastify: FastifyInstance) {
    fastify.post('/status', async (request, reply) => {
        reply.send({ status: 'ok' });

    });

    fastify.post('/server/:id/command', async (request, reply) => {
        const { id } = request.params as { id: string; };
        const { command } = request.body as { command: string };

        if (await isServerAccessible(request.apiToken, id)) {
            try {
                const result = await executeCommand(id, "run", command);
                reply.send({ status: 'ok', output: result.stdout, stderr: result.stderr, exitCode: result.exitCode });
            } catch (err) {
                reply.code(500).send({ status: 'error', error: "Internal Error" });
            }
        } else {
            reply.code(500).send({ status: 'error', error: "Server not accessible" });
        }


    });

    fastify.get('/server/:id/commands', async (request, reply) => {
        const { id } = request.params as { id: string; };

        if (await isServerAccessible(request.apiToken, id)) {
            try {
                const result = await executeCommand(id, "list");
                reply.send({ status: 'ok', output: result.stdout, stderr: result.stderr, exitCode: result.exitCode });
            } catch (err) {
                reply.code(500).send({ status: 'error', error: "Internal Error" });
            }
        } else {
            reply.code(500).send({ status: 'error', error: "Server not accessible" });
        }
    });

    fastify.get('/servers', async (request, reply) => {
        try {
            const availableServers = await getServersByToken(request.apiToken);
            reply.send({ status: 'ok', servers: availableServers });
        } catch (err) {
            reply.code(500).send({ status: 'error', error: "Internal Error" });
        }
    });
}