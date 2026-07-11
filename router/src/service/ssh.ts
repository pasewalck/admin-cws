import { Client } from 'ssh2';
import { KEY_PASSPHRASE } from '../lib/config';
import { getServerById } from './persistence';

export async function executeCommand(serverId: string, ...command: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const server = await getServerById(serverId);
    if (!server) throw new Error('Server not found');

    const client = new Client();
    return new Promise((resolve, reject) => {
        client.on('ready', () => {
            client.exec(command.join(" "), (err, stream) => {
                if (err) return reject(err);
                let stdout = '', stderr = '';
                stream.on('data', (data: any) => stdout += data.toString());
                stream.stderr.on('data', (data) => stderr += data.toString());
                stream.on('close', (exitCode: any) => {
                    client.end();
                    resolve({ stdout, stderr, exitCode: exitCode ?? -1 });
                });
            });
        });
        client.connect({
            host: server.host,
            port: 22,
            username: server.user,
            privateKey: server.encryptedKey,
            passphrase: KEY_PASSPHRASE
        });
    });
}