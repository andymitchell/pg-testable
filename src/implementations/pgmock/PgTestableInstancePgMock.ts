/**
 * FYI There's an error in Jest about '0' being undefined. 
 * It was fixed in a pull request by zfben, but not merged, so I hand modified the local node_modules. 
 * Discussion: https://github.com/stackframe-projects/pgmock/pull/14 and 
 * The fix I patched into node_modules : https://github.com/zfben/pgmock/commit/30a26e4118cbd97882e1536bd4abfede9e49bd1a
 * 
 * I'm hoping any update to pgmock will fix it (by including the merge); but if you install pgmock afresh before then, you'll need to reapply the patch. 
 */
import { PostgresMock } from "pgmock";
import * as pg from "pg";
import { PgTestableInstance, PgTestableInstanceResult, PgTransactionInstance } from "../../types";

export class PgTestableInstancePgMock<T extends Record<string, any>> implements PgTestableInstance<T> {
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
    async query(query: string, params?: any[]): Promise<PgTestableInstanceResult<T>> {
        return await this.runQuery(query, params);
    }
    protected async runQuery(query: string, params?: any[]): Promise<PgTestableInstanceResult<T>> {
        const db = await this.getDb();
        const st = Date.now();
        const result = await db.query(query, params);
        const dur = Date.now()-st; // First takes about 2.5 seconds. Subsequent is milliseconds.
        return {
            rows: result.rows
        }
    }

    async transaction(callback: (transaction:PgTransactionInstance<T>) => Promise<void>) {
        const db = new pg.Client(this.mock.getNodePostgresConfig());
        db.connect();
        const transactionInstance = new PgTestableInstancePgMock<T>({mock: this.mock, db});
        
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