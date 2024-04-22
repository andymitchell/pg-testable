export type PgTestableEnvironment = 'browser' | 'node';
export type PgTestableDbs = 'pg-mem' | 'pglite';

export type PgTestableInstanceResult<T extends Record<string, any>> = {rows:T[]}

export interface PgTestableInstance<T extends Record<string, any>> {
    NAME:Readonly<string>;
    exec(query:string):Promise<void>,
    query(query:string, params?: any[]):Promise<PgTestableInstanceResult<T>>
    dispose():Promise<void>
}