//import * as redisDB from "./persistence_redis";
import * as pgDB from "./persistence_postgres"

const isPostgres = process.env.DB_TYPE === "postgres";

export const addNote = pgDB.addNote;
export const getNotes = pgDB.getNotes;
export const getNote = pgDB.getNote;


export const closeDB = pgDB.closeDB;

