export type PgTestableEnvironment = 'browser' | 'node';
export type PgTestableDbs = 'pg-mem' | 'pglite' | 'pgmock' | 'any-real' | 'pg-client';

export type PgTestableInstanceResult<T extends Record<string, any>> = {rows:T[]}

export type PgTransactionInstance = Pick<PgTestableInstance, 'exec' | 'query'>;
export interface PgTestableInstance {
    NAME:Readonly<string>;
    exec(query:string):Promise<void>,
    query<T extends Record<string, any>>(query:string, params?: any[]):Promise<PgTestableInstanceResult<T>>,
    transaction: (callback: (transaction:PgTransactionInstance) => Promise<void>) => Promise<void>;
    
    dispose():Promise<void>
    supportsRls():boolean;
}

export type PgTestableOptionsPgClient = {};
export type PgTestableOptions = PgTestableOptionsPgClient;