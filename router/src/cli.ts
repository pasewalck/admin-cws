import { program } from 'commander';
import { v4 as uuidv4 } from 'uuid';
import {
    createServer,
    deleteServer,
    listServers,
    createApiToken,
    deleteApiToken,
    listApiTokens,
    connectTokenToServer,
    disconnectTokenFromServer,
    getServerById,
} from './service/persistence';
import { executeCommand } from './service/ssh';

program
    .name('admin-cws-router-cli')
    .version('1.0.0');

const apiKey = program.command('api-key').description('Manage API keys');

apiKey.command('create')
    .description('Create a new API key')
    .argument('<name>', 'Name of the API key')
    .action(async (name) => {
        const token = uuidv4();
        const id = await createApiToken({ token, name });
        console.log(`Created API key: ${id}`);
        console.log(`Token: ${token}`);
    });

apiKey.command('delete')
    .description('Delete an API key')
    .argument('<id>', 'ID of the API key')
    .action(async (id) => {
        await deleteApiToken(id);
        console.log(`Deleted API key: ${id}`);
    });

apiKey.command('list')
    .description('List all API keys')
    .action(async () => {
        const keys = await listApiTokens();
        for (const k of keys) {
            console.log(`${k.id}\t${k.name}\t${k.token}\t${k.createdAt}`);
        }
    });

const server = program.command('server').description('Manage servers');

server.command('create')
    .description('Create a new server')
    .argument('<name>', 'Server name')
    .argument('<host>', 'Server host')
    .argument('<user>', 'SSH user')
    .action(async (name, host, user) => {
        const id = await createServer({ name, host, user });
        const server = await getServerById(id)

        console.log(`Created server: ${id}`);
        console.log(``);
        console.log(`Run the following on the target server to set up SSH access:`);
        console.log(``);
        console.log(`sudo /usr/local/lib/admin-cws/setup.bash ${user} '${server?.publicKey}'`);
        console.log(``);
        console.log(`If admin-cws is not yet installed. Install it with:`);
        console.log(`git clone --depth 1 https://github.com/pasewalck/admin-cws.git /tmp/admin-cws && sudo make -C /tmp/admin-cws/executer install`)
    });

server.command('delete')
    .description('Delete a server')
    .argument('<id>', 'ID of the server')
    .action(async (id) => {
        await deleteServer(id);
        console.log(`Deleted server: ${id}`);
    });

server.command('list')
    .description('List all servers')
    .action(async () => {
        const servers = await listServers();
        for (const s of servers) {
            console.log(`${s.id}\t${s.name}\t${s.host}\t${s.user}\t${s.createdAt}`);
        }
    });

server.command('commands')
    .description('List available commands on a server')
    .argument('<id>', 'Server ID')
    .action(async (id) => {
        const result = await executeCommand(id, 'list');
        console.log(result.stdout);
        if (result.stderr) console.error(result.stderr);
    });

server.command('exec')
    .description('Execute a command on a server')
    .argument('<id>', 'Server ID')
    .argument('<command...>', 'Command to execute')
    .action(async (id, command) => {
        const result = await executeCommand(id, 'run', ...command);
        console.log(result.stdout);
        if (result.stderr) console.error(result.stderr);
        process.exit(result.exitCode);
    });

program.command('grant')
    .description('Grant server access to an API key')
    .argument('<tokenId>', 'API key ID')
    .argument('<serverId>', 'Server ID')
    .action(async (tokenId, serverId) => {
        await connectTokenToServer(tokenId, serverId);
        console.log(`Granted access: API key ${tokenId} -> Server ${serverId}`);
    });

program.command('revoke')
    .description('Revoke server access from an API key')
    .argument('<tokenId>', 'API key ID')
    .argument('<serverId>', 'Server ID')
    .action(async (tokenId, serverId) => {
        await disconnectTokenFromServer(tokenId, serverId);
        console.log(`Revoked access: API key ${tokenId} -> Server ${serverId}`);
    });

program.parse();
