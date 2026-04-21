import {FastifyReply, FastifyRequest} from 'fastify'

export const auth = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        await req.jwtVerify();
    } catch(err) {
        res.status(400).send({error: "Failed to verify token"});
    }
}