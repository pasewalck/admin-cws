import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Existing tables
export const servers = sqliteTable('servers', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    host: text('host').notNull(),
    user: text('user').notNull(),
    encryptedKey: text('encrypted_prv_key').notNull(),
    publicKey: text('pub_key').notNull(),
    createdAt: text('created_at').notNull()
});

export const apiTokens = sqliteTable('api_tokens', {
    id: text('id').primaryKey(),
    token: text('token').notNull(),
    name: text('name').notNull(),
    createdAt: text('created_at').notNull()
});

export const tokenServers = sqliteTable('token_servers', {
    id: text('id').primaryKey(),
    tokenId: text('token_id')
        .notNull()
        .references(() => apiTokens.id, { onDelete: 'cascade' }),
    serverId: text('server_id')
        .notNull()
        .references(() => servers.id, { onDelete: 'cascade' }),
    createdAt: text('created_at').notNull(),
});

export const tokenServerUnique = uniqueIndex('token_server_unique').on(
    tokenServers.tokenId,
    tokenServers.serverId
);