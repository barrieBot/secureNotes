import Redis from "ioredis";
const user = process.env.REDIS_USER || 'redis';
const pass = process.env.REDIS_PASSWORD || 'secret';

console.log(`redis creds: ${user}:${pass}`);

const redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    username: user,
    password: pass,
});

redis.on("error", (err) => console.error("Redis error: ", err));

export default redis;