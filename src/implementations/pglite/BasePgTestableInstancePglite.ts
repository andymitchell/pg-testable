import { PgTestableInstance, PgTestableInstanceResult } from "../../types";
import { ft } from "../../utils";

export class BasePgTestableInstancePglite<T extends Record<string, any>> implements PgTestableInstance<T> {
    NAME = 'BasePgTestableInstancePglite';
    protected db?:any;
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
    async query(query: string, params?: any[]): Promise<PgTestableInstanceResult<T>> {
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

    async dispose() {
        if( this.db ) {
            console.log(`Pglite db open for ${ft(performance.now()-this.invocation_ts)} milliseconds.\nQueries took:\n${this.queries_ts.map(x => `- ${ft(x)} milliseconds`).join(`\n`)}`);
            
            await this.db.close();
            this.db = undefined;
        }
    }
    
}