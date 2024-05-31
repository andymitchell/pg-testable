import { PgTestableInstancePgClient } from "./implementations/pg-client";
import { PgTestableInstancePgMem } from "./implementations/pg-mem";
import { PgTestableInstancePglite } from "./implementations/pglite";
import { PgTestableInstancePgMock } from "./implementations/pgmock";
import { PgTestableDbs, PgTestableEnvironment, PgTestableInstance, PgTestableInstanceResult, PgTestableOptionsPgClient, PgTransactionInstance } from "./types";



export class PgTestable implements PgTestableInstance {
    
    /**
     * DEPRECATED
     * 
     * @param real 
     * @param force 
     * @param verbose 
     * @returns 
     */
    static newDb(real: boolean = true, force?: PgTestableDbs, verbose?: boolean):PgTestableInstance {
        const environment:PgTestableEnvironment = typeof window!=='undefined'? 'browser' : 'node';
        if( force ) {
            if( real && force==='pg-mem' ) console.warn("You've forced pg-mem but requested real mode, which pg-mem isn't. Forcing takes priority: pg-mem will be used.")
            return new PgTestable(force, undefined, verbose);
        } else {
            if( real ) {
                return new PgTestable('any-real', undefined, verbose);
            } else {
                return new PgTestable('pg-mem', undefined, verbose);
            }
        }
    }


    NAME:string;
    protected client:PgTestableInstance;
    
    constructor(type:'pg-client', options:PgTestableOptionsPgClient, verbose?:boolean);
    constructor(type:Omit<PgTestableDbs, 'pg-client'>, options?:undefined, verbose?:boolean);
    constructor(type:unknown, options?:unknown, verbose?:boolean) {
        const environment:PgTestableEnvironment = typeof window!=='undefined'? 'browser' : 'node';

        if( type==='any-real' ) type = 'pglite';

        switch(type) {
            case 'pg-mem': {
                this.client = new PgTestableInstancePgMem();
                break;
            }
            case 'pglite': {
                this.client = new PgTestableInstancePglite(environment, verbose);
                break;
            }
            case 'pgmock': {
                if( environment==='browser' ) throw new Error("Not supported. The documentation says it's possible, but recommends pg-lite. https://github.com/stackframe-projects/pgmock")
                this.client = new PgTestableInstancePgMock();
                break;
            }
            case 'pg-client': {
                this.client = new PgTestableInstancePgClient(options as PgTestableOptionsPgClient);
                break;
            }
            default: {
                throw new Error("Unknown PgTestable type");
            }
        }

        this.NAME = this.client.NAME;
    }

    
    async exec(query: string): Promise<void> {
        await this.client.exec(query);
    }
    async query<T extends Record<string, any> = Record<string, any>>(query: string, params?: any[]): Promise<PgTestableInstanceResult<T>> {
        return await this.client.query(query, params);
    }
    async transaction(callback: (transaction: PgTransactionInstance) => Promise<void>):Promise<void> {
        await this.client.transaction(callback);
    }
    async dispose(): Promise<void> {
        await this.client.dispose();
    }
    supportsRls(): boolean {
        return this.client.supportsRls();
    }

    

}