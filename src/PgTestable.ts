import { PgTestableInstancePgMem } from "./implementations/pg-mem";
import { PgTestableInstancePglite } from "./implementations/pglite";
import { PgTestableDbs, PgTestableEnvironment, PgTestableInstance } from "./types";

export class PgTestable {
    // TODO For pglite/pgmock, it might be more performant to open one db, and run an "instance" as a transaction
    // Or, to create one DB, but run the tests with different table names 

    static newDb<T extends Record<string, any>>(real: boolean = true, force?: PgTestableDbs):PgTestableInstance<T> {
        const environment:PgTestableEnvironment = typeof window!=='undefined'? 'browser' : 'node';
        if( force ) {
            if( real && force==='pg-mem' ) console.warn("You've forced pg-mem but requested real mode, which pg-mem isn't. Forcing takes priority: pg-mem will be used.")
            return PgTestable.generateNewDb<T>(force, environment);
        } else {
            if( real ) {
                return PgTestable.generateNewDb<T>('pglite', environment);
            } else {
                return PgTestable.generateNewDb<T>('pg-mem', environment);
            }
        }
    }

    private static generateNewDb<T extends Record<string, any>>(name: PgTestableDbs, environment:PgTestableEnvironment) {
        switch(name) {
            case 'pg-mem': {
            return new PgTestableInstancePgMem<T>();
            }
            case 'pglite': {
                return new PgTestableInstancePglite<T>(environment);
            }
        }
    }

    

}