import { PgTestable } from "./PgTestable";
import { PgTestableDbs, PgTestableInstance } from "./types";
import queue from "./utils/queue";

// Set up the DB once (it's expensive for pglite), and run each test in its own table
export class DbMultipleTestsRunner { 
    private db: PgTestableInstance<any>
    private activeTests: {id: string}[];
    private keepAliveUntilTs: number;
    private promiseComplete:Promise<void>;
    private testTableNameIndex: number;
    private disposed:boolean;
    private waitForAnotherTestMs:number;
    constructor(real?: boolean, force?: PgTestableDbs, disposeOnComplete = true, waitForAnotherTestMs = 1000*5) {
        this.db = PgTestable.newDb(real, force);
        this.activeTests = [];
        this.keepAliveUntilTs = Date.now();
        this.testTableNameIndex = 0;
        this.disposed = false;
        this.waitForAnotherTestMs = waitForAnotherTestMs;

        // It's complete when: no more tests have run + a time buffer has passed (a period in which a new test could be started)
        this.promiseComplete = new Promise<void>(accept => {
            const t = setInterval(async () => {
                if( this.activeTests.length===0 && this.keepAliveUntilTs<Date.now() ) {
                    clearInterval(t);
                    if( disposeOnComplete ) {
                        console.warn(`Disposing...\nactive tests: ${this.activeTests.length}.\nlast activity:${ this.keepAliveUntilTs}\nnow: ${Date.now()}`);
                        await this.dispose();
                    }
                    accept();
                }
            }, 500);
        })
    }


    async sequentialTest<T>(callback:(runner: DbMultipleTestsRunner, db:PgTestableInstance<any>, uniqueTableName:string) => Promise<T>, tag: string = ''):Promise<T>{

        // pglite seemingly can't cope with creating and selecting multiple tables in an interleaving manner. Or possibly it just wants to run all its creates first (we could do this as a test set up).
        const release = this.lockAliveForTest();
        return queue('pgtestrunner', async () => {
            if( this.disposed) throw new Error(`${tag} Database already disposed. Create a new runner.`);
            this.keepAlive();
            const result = await callback(this, this.db, this.getUniqueTableName());
            release();
            return result;
        })
    }

    private async dispose() {
        this.disposed = true;
        await this.db.dispose();
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
        this.keepAliveUntilTs = Date.now()+this.waitForAnotherTestMs;
    }

    async isComplete() {
        return this.promiseComplete;
    }


}