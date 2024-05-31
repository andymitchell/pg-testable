
import { PostgresMock } from "pgmock";
import * as pg from "pg";
import { PgTestableInstance, PgTestableInstanceResult, PgTransactionInstance } from "../../types";

export class PgTestableInstancePgMock implements PgTestableInstance {
    NAME = 'PgTestableInstancePgMock';
    private mock:PostgresMock;
    private db:pg.Client;
    private isTransaction:boolean;
    private isDisposed?:boolean;
    
    constructor(transaction?: {mock: PostgresMock, db:pg.Client}) {
        if( transaction ) {
            this.mock = transaction.mock; 
            this.db = transaction.db; 
        }
        this.isTransaction = !!transaction;
    }


    async getDb():Promise<pg.Client> {
        if( !this.db ) {
            
            const st = Date.now();
            this.mock = await PostgresMock.create();
            if( this.isDisposed ) {
                // It can be so slow to load, that it can be disposed while it's loading 
                this.dispose();
                return; 
            }
            const config = this.mock.getNodePostgresConfig();

            this.db = new pg.Client(config);
            this.db.connect();
            const dur = Date.now()-st; // Takes sub 1 second
        }
        return this.db;
    }

    async exec(query: string): Promise<void> {
        await this.runQuery(query);
    }
    async query<T extends Record<string, any> = Record<string, any>>(query: string, params?: any[]): Promise<PgTestableInstanceResult<T>> {
        return await this.runQuery<T>(query, params);
    }
    protected async runQuery<T extends Record<string, any>>(query: string, params?: any[]): Promise<PgTestableInstanceResult<T>> {
        const db = await this.getDb();
        const st = Date.now();
        const result = await db.query(query, params);
        const dur = Date.now()-st; // First takes about 2.5 seconds. Subsequent is milliseconds.
        return {
            rows: result.rows
        }
    }

    async transaction(callback: (transaction:PgTransactionInstance) => Promise<void>) {
        const db = new pg.Client(this.mock.getNodePostgresConfig());
        db.connect();
        const transactionInstance = new PgTestableInstancePgMock({mock: this.mock, db});
        
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
        if( !this.isTransaction ) {
            this.mock.destroy();
            await new Promise<void>(accept => {
                console.log("Shutdown timer");
                setTimeout(() => accept(), 1000*3);
            })
        }
    }

    supportsRls() { return true }

}