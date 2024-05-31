

import * as pg from "pg";
import { PgTestableInstance, PgTestableInstanceResult, PgTestableOptionsPgClient, PgTransactionInstance } from "../../types";

export class PgTestableInstancePgClient implements PgTestableInstance {
    NAME = 'PgTestableInstancePgClient';
    
    private db:pg.Client;
    private isDisposed?:boolean;
    private config: PgTestableOptionsPgClient
    
    constructor(config?:string | pg.ClientConfig) {
        
        this.config = config;
        this.db = new pg.Client(config);
        this.db.connect();
    
    }



    async exec(query: string): Promise<void> {
        await this.runQuery(query);
    }
    async query<T extends Record<string, any> = Record<string, any>>(query: string, params?: any[]): Promise<PgTestableInstanceResult<T>> {
        return await this.runQuery<T>(query, params);
    }
    protected async runQuery<T extends Record<string, any>>(query: string, params?: any[]): Promise<PgTestableInstanceResult<T>> {
        if( this.isDisposed ) throw new Error("Cannot run query after disposed");
        const result = await this.db.query(query, params);
        return {
            rows: result.rows
        }
    }

    async transaction(callback: (transaction:PgTransactionInstance) => Promise<void>) {
        
        const transactionInstance = new PgTestableInstancePgClient(this.config);
        
        await transactionInstance.query('BEGIN');
        try {
            await callback(transactionInstance);
            await transactionInstance.query('COMMIT');
        } catch(e) {
            await transactionInstance.query('ROLLBACK');
            throw e;
        } finally {
            transactionInstance.dispose();
        }
    }

    async dispose() {
        this.isDisposed = true;
        if( this.db ) {
            await this.db.end();
        }
        
        await new Promise<void>(accept => {
            setTimeout(() => accept(), 1000*3);
        })
    }

    supportsRls() { return true }

}