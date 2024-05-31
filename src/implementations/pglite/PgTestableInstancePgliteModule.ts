import { PgTestableInstance } from '../../types';
import { BasePgTestableInstancePglite } from './BasePgTestableInstancePglite';
import { PGlite } from "@electric-sql/pglite";

export class PgTestableInstancePgliteModule<T extends Record<string, any>> extends BasePgTestableInstancePglite<T> implements PgTestableInstance {
    NAME = 'PgTestableInstancePgliteModule';


    async getDb():Promise<any> {
        if( !this.dbPromise ) {
            this.dbPromise = new Promise(async accept => {
                const db = new PGlite();
                accept(db);
            });
            
            
            

            
            
        }
        return this.dbPromise;
    }

}