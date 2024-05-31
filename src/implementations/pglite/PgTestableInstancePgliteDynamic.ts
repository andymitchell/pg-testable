import { PgTestableInstance } from '../../types';
import { BasePgTestableInstancePglite } from './BasePgTestableInstancePglite';

/**
 * This exists to be able to run PgLite in the browser. 
 */

export class PgTestableInstancePgliteDynamic<T extends Record<string, any>> extends BasePgTestableInstancePglite<T> implements PgTestableInstance {
    override NAME = 'PgTestableInstancePgliteDynamic';
    static loading:Promise<any>;
    constructor() {
        super();

        if( !PgTestableInstancePgliteDynamic.loading ) {
            PgTestableInstancePgliteDynamic.loading = new Promise(async accept => {
                
                
                if( this.verbose ) console.log("PgTestableInstancePgliteDynamic downloading dynamic module to import");

                // @ts-ignore No idea why it hates the url
                const module = await import('https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js');
                accept(module);
            })
        }
    }

    override async getDb():Promise<any> {
        if( !this.dbPromise ) {
            this.dbPromise = new Promise(async accept => {
                const module = await PgTestableInstancePgliteDynamic.loading;
                const db = new module.PGlite();
                accept(db);
            })
            
        }
        return this.dbPromise;
    }

}