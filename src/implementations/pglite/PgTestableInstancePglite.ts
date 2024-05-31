import { PgTestableEnvironment, PgTestableInstance } from '../../types';
import { BasePgTestableInstancePglite } from './BasePgTestableInstancePglite';

import { PgTestableInstancePgliteDynamic } from './PgTestableInstancePgliteDynamic';
import { PgTestableInstancePgliteModule } from './PgTestableInstancePgliteModule';

export class PgTestableInstancePglite<T extends Record<string, any>> extends BasePgTestableInstancePglite<T> implements PgTestableInstance {
    override NAME = 'PgTestableInstancePglite';
    private environment:PgTestableEnvironment;
    
    

    
    constructor(environment:PgTestableEnvironment, verbose?:boolean) {
        super(verbose);
        this.environment = environment;
    }
    

    override async getDb():Promise<any> {
        if( !this.dbPromise ) {
            this.dbPromise = new Promise(async accept => {
                let db:any;
                switch(this.environment) {
                    case 'browser': {
                        if( this.verbose ) console.log(`PgTestableInstancePglite launching using dynamic.`);
                        const container = new PgTestableInstancePgliteDynamic();
                        db = await container.getDb();
                        break;
                    }
                    case 'node': {
                        if( this.verbose ) console.log(`PgTestableInstancePglite launching using module.`);
                        const container = new PgTestableInstancePgliteModule();
                        db = await container.getDb();
                        break;
                    }
                }
                accept(db);
            })
        }
        return this.dbPromise;
    }

}