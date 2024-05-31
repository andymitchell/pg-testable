import { PgTestableInstancePgClient } from "./implementations/pg-client";
import { PgTestableInstancePgMem } from "./implementations/pg-mem";
import { PgTestableInstancePglite } from "./implementations/pglite";
import { PgTestableInstancePgMock } from "./implementations/pgmock";
import {  PgTestableDbDefinitions, PgTestableEnvironment, PgTestableInstance, PgTestableInstanceResult, PgTestableOptionsPgClient, PgTransactionInstance } from "./types";



export class PgTestable implements PgTestableInstance {
    
    

    NAME:string;
    protected client:PgTestableInstance;
    
    
    constructor(definition:PgTestableDbDefinitions, verbose?:boolean) {
        const environment:PgTestableEnvironment = typeof window!=='undefined'? 'browser' : 'node';

        if( definition.type==='any-real' ) definition = {type: 'pglite'};

        switch(definition.type) {
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
                this.client = new PgTestableInstancePgClient(definition.config);
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

