export type PgTestableEnvironment = 'browser' | 'node';
export type PgTestableDbs = 'pg-mem' | 'pglite' | 'pgmock';

export type PgTestableInstanceResult<T extends Record<string, any>> = {rows:T[]}

export type PgTransactionInstance<T extends Record<string, any>> = Pick<PgTestableInstance<T>, 'exec' | 'query'>;
export interface PgTestableInstance<T extends Record<string, any>> {
    NAME:Readonly<string>;
    exec(query:string):Promise<void>,
    query(query:string, params?: any[]):Promise<PgTestableInstanceResult<T>>,
    transaction: (callback: (transaction:PgTransactionInstance<T>) => Promise<void>) => Promise<void>;
    
    dispose():Promise<void>
    supportsRls():boolean;
}