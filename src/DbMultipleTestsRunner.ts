import { PgTestable } from "./PgTestable";
import { PgTestableDbs, PgTestableInstance, PgTestableOptions, PgTestableOptionsPgClient } from "./types";
import { QueueWorkspace } from "@andyrmitchell/utils";

// Set up the DB once (it's expensive for pglite), and run each test in its own table
export class DbMultipleTestsRunner { 
    private db: PgTestableInstance
    private activeTests: {id: string}[];
    private promiseDisposed:Promise<boolean>;
    private promiseDisposedTrigger: Function;
    private disposed:boolean;
    private testTableNameIndex: number;
    private queue:QueueWorkspace;
    
    constructor(type:'pg-client', options:PgTestableOptionsPgClient, verbose?:boolean);
    constructor(type:PgTestableDbs, options?:PgTestableOptions, verbose?:boolean);
    constructor(type:unknown, options?:unknown, verbose?:boolean) {
        this.db = new PgTestable(type as PgTestableDbs, options, verbose);
        this.activeTests = [];
        this.testTableNameIndex = 0;
        this.disposed = false;
        this.queue = new QueueWorkspace();
        

        this.promiseDisposed = new Promise<boolean>(resolve => {
            this.promiseDisposedTrigger = () => resolve(true);
        });
    }


    async sequentialTest<T>(callback:(runner: DbMultipleTestsRunner, db:PgTestableInstance, uniqueTableName:string) => Promise<T>, tag: string = ''):Promise<T>{
        // pglite seemingly can't cope with creating and selecting multiple tables in an interleaving manner. Or possibly it just wants to run all its creates first (we could do this as a test set up).
        const release = this.lockAliveForTest();
        return this.queue.enqueue('DbMulitpleTestsRunner.test-run', async () => {
            if( this.disposed) throw new Error(`DbMulitpleTestsRunner[${tag}] Database already disposed. Create a new runner.`);
            let result:Awaited<T>;
            try {
                result = await callback(this, this.db, this.getUniqueTableName());
                release();
                return result;
            } catch(e) {
                if( e instanceof Error ) {
                    console.warn("Error in DbMulitpleTestsRunner test callback "+e.message);
                }
                release();
                throw e;
            }
            
        })
    }


    async dispose(force?:boolean) {
        if( this.activeTests.length>0 && !force ) {
            console.warn("DBMultipleTestsRunner cannot dispose while active tests are running.");
            return;
        }
        this.disposed = true;
        await this.db.dispose();
        this.promiseDisposedTrigger();
    }

    private lockAliveForTest() {
        const q = {id: performance.now()+''+Math.floor(Math.random()*1000)}
        this.activeTests.push(q);
        const release = () => {
            this.activeTests = this.activeTests.filter(x => x.id!==q.id);
        }
        return release;
    }


    getUniqueTableName() {
        return `test_${this.testTableNameIndex++}_table`;
    }


    async isComplete() {
        return await this.promiseDisposed;
    }


}