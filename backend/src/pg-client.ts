import { Pool } from "pg"

const pool = new Pool({
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "pg_pwd",
    database: process.env.POSTGRES_DB || "notes_db"
});


pool.on("error", (err) => console.error("PG-error: ", err));

export default pool;