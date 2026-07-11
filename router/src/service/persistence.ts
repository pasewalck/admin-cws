import { db } from '../lib/database';
import { servers, apiTokens, tokenServers } from '../lib/schema';
import { and, eq } from 'drizzle-orm';
import { generateEphemeralKey } from '../lib/ssh-key';
import { v4 as uuidv4 } from 'uuid';

export async function getServerById(id: string): Promise<typeof servers.$inferSelect | null> {
    return db
        .select()
        .from(servers)
        .where(eq(servers.id, id))
        .limit(1)
        .then(rows => rows[0] ?? null);
}

export async function getServersByToken(tokenId: string): Promise<{ id: string, name: string, host: string, user: string }[]> {
    return db
        .select({ id: servers.id, name: servers.name, host: servers.host, user: servers.user })
        .from(tokenServers)
        .innerJoin(servers, eq(tokenServers.serverId, servers.id))
        .where(eq(tokenServers.tokenId, tokenId));
}

export async function getApiTokenByKey(token: string): Promise<typeof apiTokens.$inferSelect | null> {
    return db
        .select()
        .from(apiTokens)
        .where(eq(apiTokens.token, token))
        .limit(1)
        .then(rows => rows[0] ?? null);
}

export async function validateApiToken(token: string): Promise<boolean> {
    const row = await db
        .select()
        .from(apiTokens)
        .where(eq(apiTokens.token, token))
        .limit(1)
        .then(rows => rows[0] ?? null);

    return row != null;

}

export async function isServerAccessible(tokenId: string, serverId: string): Promise<boolean> {
    const row = await db
        .select({ host: servers.host })
        .from(tokenServers)
        .innerJoin(servers, eq(tokenServers.serverId, servers.id))
        .where(and(eq(tokenServers.tokenId, tokenId), eq(servers.id, serverId)))
        .limit(1)
        .then(rows => rows[0]);

    return row != null;
}

export async function createServer(data: {
    name: string;
    host: string;
    user: string;
}): Promise<string> {
    const { encryptedPrivateKey, sshPublicKey } = await generateEphemeralKey()
    const id = uuidv4()
    await db.insert(servers).values({
        id: id,
        name: data.name,
        host: data.host,
        user: data.user,
        encryptedKey: encryptedPrivateKey,
        publicKey: sshPublicKey,
        createdAt: new Date().toISOString(),
    });
    return id
}

export async function createApiToken(data: {
    token: string;
    name: string;
}): Promise<string> {
    const id = uuidv4()
    await db.insert(apiTokens).values({
        id: id,
        token: data.token,
        name: data.name,
        createdAt: new Date().toISOString(),
    });
    return id
}

export async function deleteApiToken(id: string): Promise<void> {
    await db.delete(apiTokens).where(eq(apiTokens.id, id));
}

export async function deleteServer(id: string): Promise<void> {
    await db.delete(servers).where(eq(servers.id, id));
}

export async function connectTokenToServer(tokenId: string, serverId: string): Promise<void> {
    await db.insert(tokenServers).values({
        id: uuidv4(),
        tokenId,
        serverId,
        createdAt: new Date().toISOString(),
    });
}

export async function disconnectTokenFromServer(tokenId: string, serverId: string): Promise<void> {
    await db.delete(tokenServers).where(
        and(eq(tokenServers.tokenId, tokenId), eq(tokenServers.serverId, serverId))
    );
}

export async function listServers(): Promise<typeof servers.$inferSelect[]> {
    return db.select().from(servers);
}

export async function listApiTokens(): Promise<typeof apiTokens.$inferSelect[]> {
    return db.select().from(apiTokens);
}