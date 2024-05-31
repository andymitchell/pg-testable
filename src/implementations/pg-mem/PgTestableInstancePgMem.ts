import { IMemoryDb, newDb } from "pg-mem";
import { PgTestableInstance, PgTestableInstanceResult, PgTransactionInstance } from "../../types";

export class PgTestableInstancePgMem<T extends Record<string, any>> implements PgTestableInstance {
    NAME = 'PgTestableInstancePgMem';
    private db:IMemoryDb;
    
    constructor() {
        this.db = newDb();
        
    }
    async exec(query: string): Promise<void> {
        await this.runQuery(query);
    }
    async query<T extends Record<string, any> = Record<string, any>>(query: string, params?: any[]): Promise<PgTestableInstanceResult<T>> {
        return await this.runQuery<T>(query, params);
    }
    protected async runQuery<T extends Record<string, any> = Record<string, any>>(query: string, params?: any[]): Promise<PgTestableInstanceResult<T>> {
        
        if( params ) {
            params.forEach((param, index) => {
                const placeholder = new RegExp(`\\$${index + 1}`, 'g');

                const safeParam = typeof param === 'string' ? param.replace(/'/g, "''") : param;
                query = query.replace(placeholder, `'${safeParam}'`);
            });
        }
        const result = this.db.public.query(query);
        return {
            rows: result.rows
        }
    }

    async transaction(callback: (transaction:PgTransactionInstance) => Promise<void>) {
        const backup = this.db.backup();
        try {
            await callback(this);
        } catch(e) {
            backup.restore();
            throw e;
        }
        
    }

    async dispose() {
        this.db = newDb();
    }

    supportsRls() { return false }
}