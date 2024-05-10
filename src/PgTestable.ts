import { PgTestableInstancePgMem } from "./implementations/pg-mem";
import { PgTestableInstancePglite } from "./implementations/pglite";
import { PgTestableInstancePgMock } from "./implementations/pgmock";
import { PgTestableDbs, PgTestableEnvironment, PgTestableInstance } from "./types";

export class PgTestable {
    // TODO For pglite/pgmock, it might be more performant to open one db, and run an "instance" as a transaction
    // Or, to create one DB, but run the tests with different table names 

    static newDb<T extends Record<string, any>>(real: boolean = true, force?: PgTestableDbs, verbose?: boolean):PgTestableInstance<T> {
        const environment:PgTestableEnvironment = typeof window!=='undefined'? 'browser' : 'node';
        if( force ) {
            if( real && force==='pg-mem' ) console.warn("You've forced pg-mem but requested real mode, which pg-mem isn't. Forcing takes priority: pg-mem will be used.")
            return PgTestable.generateNewDb<T>(force, environment, verbose);
        } else {
            if( real ) {
                return PgTestable.generateNewDb<T>('pglite', environment, verbose);
            } else {
                return PgTestable.generateNewDb<T>('pg-mem', environment, verbose);
            }
        }
    }

    private static generateNewDb<T extends Record<string, any>>(name: PgTestableDbs, environment:PgTestableEnvironment, verbose?:boolean) {
        if( verbose ) console.log(`Generating new PgTestableInstance: ${name} in ${environment}`, Date.now());
        switch(name) {
            case 'pg-mem': {
                return new PgTestableInstancePgMem<T>();
            }
            case 'pglite': {
                return new PgTestableInstancePglite<T>(environment, verbose);
            }
            case 'pgmock': {
                if( environment==='browser' ) throw new Error("Not supported. The documentation says it's possible, but recommends pg-lite. https://github.com/stackframe-projects/pgmock")
                return new PgTestableInstancePgMock<T>();
            }
        }
    }

    

}