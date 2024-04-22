import { PgTestableEnvironment, PgTestableInstance } from '../../types';
import { BasePgTestableInstancePglite } from './BasePgTestableInstancePglite';

import { PgTestableInstancePgliteDynamic } from './PgTestableInstancePgliteDynamic';
import { PgTestableInstancePgliteModule } from './PgTestableInstancePgliteModule';

export class PgTestableInstancePglite<T extends Record<string, any>> extends BasePgTestableInstancePglite<T> implements PgTestableInstance<T> {
    NAME = 'PgTestableInstancePglite';
    private environment:PgTestableEnvironment;
    
    constructor(environment:PgTestableEnvironment) {
        super();
        this.environment = environment;
    }
    

    async getDb():Promise<any> {
        if( !this.db ) {
            switch(this.environment) {
                case 'browser': {
                    const container = new PgTestableInstancePgliteDynamic();
                    this.db = await container.getDb();
                    break;
                }
                case 'node': {
                    const container = new PgTestableInstancePgliteModule();
                    this.db = await container.getDb();
                    break;
                }
            }
        }
        return this.db;
    }

}