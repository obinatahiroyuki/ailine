import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./db/schema";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error(
    "TURSO_DATABASE_URL と TURSO_AUTH_TOKEN を環境変数に設定してください"
  );
}

const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });
