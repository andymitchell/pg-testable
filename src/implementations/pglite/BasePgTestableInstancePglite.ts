import { PgTestableInstance, PgTestableInstanceResult, PgTransactionInstance } from "../../types";
import { ft } from "../../utils";

export class BasePgTestableInstancePglite<T extends Record<string, any>> implements PgTestableInstance {
    NAME = 'BasePgTestableInstancePglite';
    protected dbPromise?:any;
    protected invocation_ts:number;
    protected queries_ts: number[];
    protected verbose: boolean;

    constructor(verbose?: boolean) {
        this.invocation_ts = performance.now();
        this.queries_ts = [];
        this.verbose = verbose ?? false;
    }

    async getDb():Promise<any> {
        throw new Error("Method not implemented");
    }

    async exec(query: string): Promise<void> {
        const db = await this.getDb();
        const st = performance.now();
        try {
            await db.exec(query);
        } catch(e) {
            if( e instanceof Error ) {
                console.warn(`Error in pglite exec ${query}: ${e.message}`);
            }
            throw e;
        }
        this.queries_ts.push(performance.now()-st);
    }
    async query<T extends Record<string, any> = Record<string, any>>(query: string, params?: any[]): Promise<PgTestableInstanceResult<T>> {
        const db = await this.getDb();
        const st = performance.now();
        try {
            const result = await db.query(query, params);
            this.queries_ts.push(performance.now()-st);
            return result;
        } catch(e) {
            if( e instanceof Error ) {
                console.warn(`Error in pglite query ${query}: ${e.message}`);
            }
            throw e;
        }
        
    }

    async transaction(callback: (transaction:PgTransactionInstance) => Promise<void>) {
        const db = await this.getDb();
        await db.transaction(callback);
    }

    async dispose() {
        if( this.dbPromise ) {
            if( this.verbose ) {
                console.log(`Pglite db open for ${ft(performance.now()-this.invocation_ts)} milliseconds.\nQueries took:\n${this.queries_ts.map(x => `- ${ft(x)} milliseconds`).join(`\n`)}`);
            }
            const db = await this.dbPromise;
            await db.close();
            this.dbPromise = undefined;
        }
    }

    supportsRls() { return false }

}