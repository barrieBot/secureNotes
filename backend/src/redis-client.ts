import Redis from "ioredis";

const redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    username: process.env.REDIS_USER || "redis",
    password: process.env.REDIS_PASSWORD,
});

redis.on("error", (err) => console.error("Redis error: ", err));

export default redis;