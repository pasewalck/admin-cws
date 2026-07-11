import { generateKeyPairSync } from "crypto"
import { KEY_PASSPHRASE } from "./config";
import sshpk from "sshpk"

export async function generateEphemeralKey(): Promise<{
    encryptedPrivateKey: string;
    sshPublicKey: string;
}> {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    const key = sshpk.parsePrivateKey(privateKey, 'pem');
    const sshPublicKey = key.toPublic().toString('ssh');

    const encryptedPrivateKey = key.toString('ssh-private', {
        passphrase: KEY_PASSPHRASE || undefined
    });

    return { encryptedPrivateKey, sshPublicKey };
}