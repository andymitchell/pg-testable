import { PostgresHelpers } from "@andyrmitchell/utils";
import { PgTestable } from "./PgTestable";
import { PgTestableDbs, PgTestableEnvironment, PgTestableInstance, PgTestableInstanceResult, PgTestableOptions, PgTestableOptionsPgClient, PgTestableVirtualInstance, PgTransactionInstance } from "./types";
import { v4 as uuidv4 } from "uuid";

export function generateUniqueSchema(): string {
    return `test_${uuidv4().replace(/\-/g, '')}`;
}


export class PgTestableVirtual implements PgTestableVirtualInstance {
   
    NAME: string;
    private db:PgTestableInstance;
    private schema:string;
    private loadingPromise:Promise<void>;
    
    constructor(db:PgTestableInstance) {
        this.db = db;
        this.NAME = db.NAME;

        this.schema = generateUniqueSchema();

        this.loadingPromise = new Promise<void>(async resolve => {
            await this.db.exec(`CREATE SCHEMA IF NOT EXISTS "${this.schema}"`);
            resolve();
        });
        
    }
    
    supportsRls(): boolean {
        return this.db.supportsRls();
    }

    async onceLoaded():Promise<void> {
        await this.loadingPromise;
    }

    async exec(query: string): Promise<void> {
        await this.onceLoaded();
        if( query.indexOf(this.schema)===-1 ) console.warn(`The query is not schema scoped - it's still the client's responsibility to do so. Query: ${query}`);
        await this.db.exec(query);
    }

    async query<T extends Record<string, any> = Record<string, any>>(query: string, params?: any[] | undefined): Promise<PgTestableInstanceResult<T>> {
        await this.onceLoaded();
        if( query.indexOf(this.schema)===-1 ) console.warn(`The query is not schema scoped - it's still the client's responsibility to do so. Query: ${query}`);
        return await this.db.query(query, params);
    }

    async transaction(callback: (transaction: PgTransactionInstance) => Promise<void>): Promise<void> {
        await this.onceLoaded();
        await this.db.transaction(callback);
    }

    async dispose(): Promise<void> {
        await this.onceLoaded();
        await this.db.exec(`DROP SCHEMA IF EXISTS "${this.schema}" cascade`);
    }

    getSchema(): string {
        return this.schema;
    }

    schemaScope(identifier:string):string {
        if( !identifier ) throw new Error("Identifier expects to schema scope");
        identifier = PostgresHelpers.escapeIdentifier(identifier);
        return `${this.getSchema()}.${identifier}`;
    }

}