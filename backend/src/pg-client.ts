import { Pool } from "pg"

const pool = new Pool({
    host: process.env.PG_HOST || "localhost",
    port: Number(process.env.PG_PORT) || 5432,
    user: process.env.PG_USER || "postgres",
    password: process.env.PG_PASSWORD || "pg_pwd",
    database: process.env.PG_DATABASE || "nodes_db"
});


pool.on("error",(err) => console.error("PG-error: ", err));

export default pool;