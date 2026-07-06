import * as redisDB from "./persistence_redis";
import * as pgDB from "./persistence_postgres"

const isPostgres = process.env.DB_TYPE === "postgres";

export const addNote = isPostgres ? pgDB.addNote : redisDB.addNote;
export const getNotes = isPostgres ? pgDB.getNotes : redisDB.getNotes;
export const gotNote = isPostgres ? pgDB.getNote : redisDB.getNote;


export const closeDB = isPostgres ? pgDB.closeDB : redisDB.closeDB;

