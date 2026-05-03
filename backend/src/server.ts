import 'dotenv/config';
import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import { routes } from './routes';

const server = Fastify({ logger: true });

// validate JWT secret at startup
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable is required in production');
    }
    console.warn('Warning: JWT_SECRET not set, using insecure development fallback');
}

server.register(fastifyCors, {
    origin: process.env.NODE_ENV === 'production'
        ? 'https://yourdomain.com'
        : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

server.register(fastifyJwt, {
    secret: JWT_SECRET ?? 'dev-only-insecure-secret',
});

server.register(routes, { prefix: '/api/v1' });

// start server
const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || 1234;

const serve = async () => {
    try {
        await server.listen({ host: HOST, port: Number(PORT) });
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

serve();