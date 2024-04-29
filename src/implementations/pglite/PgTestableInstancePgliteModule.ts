import { PgTestableInstance } from '../../types';
import { BasePgTestableInstancePglite } from './BasePgTestableInstancePglite';
import { PGlite } from "@electric-sql/pglite";

export class PgTestableInstancePgliteModule<T extends Record<string, any>> extends BasePgTestableInstancePglite<T> implements PgTestableInstance<T> {
    NAME = 'PgTestableInstancePgliteModule';


    async getDb():Promise<any> {
        if( !this.db ) {
            const db = new PGlite();
            this.db = db;
            

            
            
        }
        return this.db;
    }

}