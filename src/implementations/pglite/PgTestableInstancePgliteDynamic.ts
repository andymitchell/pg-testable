import { PgTestableInstance } from '../../types';
import { BasePgTestableInstancePglite } from './BasePgTestableInstancePglite';

export class PgTestableInstancePgliteDynamic<T extends Record<string, any>> extends BasePgTestableInstancePglite<T> implements PgTestableInstance<T> {
    NAME = 'PgTestableInstancePgliteDynamic';
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

    async getDb():Promise<any> {
        if( !this.db ) {
            const module = await PgTestableInstancePgliteDynamic.loading;
            this.db = new module.PGlite();
        }
        return this.db;
    }

}