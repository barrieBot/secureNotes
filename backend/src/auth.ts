// Authentication middleware for Fastify routes.
// 
// This module exports a single `auth` function that can be used
// as a route preHandler. It verifies a JWT token attached to the
// request using the `fastify-jwt` plugin. If the token is missing,
// invalid, or expired, the middleware sends a 400 response with a
// generic error message. The actual error details are omitted to
// avoid leaking sensitive information.

import { FastifyReply, FastifyRequest } from 'fastify'

export const auth = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        // `jwtVerify` is provided by the `fastify-jwt` plugin.
        await req.jwtVerify()
    } catch (err) {
        // Respond with a generic error message. In production you might
        // want to differentiate between authentication and authorization
        // errors, but keep the message minimal for security.
        res.status(400).send({ error: 'Failed to verify token' })
    }
}