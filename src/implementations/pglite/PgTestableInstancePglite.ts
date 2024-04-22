import { PgTestableEnvironment, PgTestableInstance } from '../../types';
import { BasePgTestableInstancePglite } from './BasePgTestableInstancePglite';

import { PgTestableInstancePgliteDynamic } from './PgTestableInstancePgliteDynamic';
import { PgTestableInstancePgliteModule } from './PgTestableInstancePgliteModule';

export class PgTestableInstancePglite<T extends Record<string, any>> extends BasePgTestableInstancePglite<T> implements PgTestableInstance<T> {
    NAME = 'PgTestableInstancePglite';
    private environment:PgTestableEnvironment;
    private verbose: boolean;
    
    constructor(environment:PgTestableEnvironment, verbose?:boolean) {
        super();
        this.environment = environment;
        this.verbose = verbose;
    }
    

    async getDb():Promise<any> {
        if( !this.db ) {
            switch(this.environment) {
                case 'browser': {
                    if( this.verbose ) console.log(`PgTestableInstancePglite launching using dynamic.`);
                    const container = new PgTestableInstancePgliteDynamic();
                    this.db = await container.getDb();
                    break;
                }
                case 'node': {
                    if( this.verbose ) console.log(`PgTestableInstancePglite launching using module.`);
                    const container = new PgTestableInstancePgliteModule();
                    this.db = await container.getDb();
                    break;
                }
            }
        }
        return this.db;
    }

}