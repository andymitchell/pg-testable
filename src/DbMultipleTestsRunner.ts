import { PgTestable } from "./PgTestable";
import { PgTestableDbs, PgTestableInstance } from "./types";
import queue from "./utils/queue";

// Set up the DB once (it's expensive for pglite), and run each test in its own table
export class DbMultipleTestsRunner { 
    private db: PgTestableInstance<any>
    private activeTests: {id: string}[];
    private lastActivityTs: number;
    private promiseComplete:Promise<void>;
    private testTableNameIndex: number;
    private disposed:boolean;
    private timeoutMs:number;
    constructor(real?: boolean, force?: PgTestableDbs, disposeOnComplete = true, timeoutMs = 1000*5) {
        this.db = PgTestable.newDb(real, force);
        this.activeTests = [];
        this.lastActivityTs = Date.now();
        this.testTableNameIndex = 0;
        this.disposed = false;
        this.timeoutMs = timeoutMs;

        // It's complete when: no more tests have run + a time buffer has passed (a period in which a new test could be started)
        this.promiseComplete = new Promise<void>(accept => {
            const t = setInterval(() => {
                if( this.activeTests.length===0 && this.lastActivityTs<(Date.now()-this.timeoutMs) ) {
                    clearInterval(t);
                    if( disposeOnComplete ) this.dispose();
                    accept();
                }
            }, 500);
        })
    }


    async sequentialTest<T>(callback:(runner: DbMultipleTestsRunner, db:PgTestableInstance<any>, uniqueTableName:string) => Promise<T>):Promise<T>{
        if( this.disposed) throw new Error("Database already disposed. Create a new runner.");
        // pglite seemingly can't cope with creating and selecting multiple tables in an interleaving manner. Or possibly it just wants to run all its creates first (we could do this as a test set up).
        return queue('pgtestrunner', async () => {
            const release = this.lockAliveForTest();
            const result = await callback(this, this.db, this.getUniqueTableName());
            release();
            return result;
        })
    }

    private dispose() {
        this.disposed = true;
        this.db.dispose();
    }

    private lockAliveForTest() {
        this.keepAlive();
        const q = {id: performance.now()+''+Math.floor(Math.random()*1000)}
        this.activeTests.push(q);
        const release = () => {
            this.keepAlive();
            this.activeTests = this.activeTests.filter(x => x.id!==q.id);
        }
        return release;
    }


    getUniqueTableName() {
        return `test_${this.testTableNameIndex++}_table`;
    }

    private keepAlive() {
        this.lastActivityTs = Date.now();
    }

    async isComplete() {
        return this.promiseComplete;
    }


}