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
    private started:boolean;
    private waitForAnotherTestMs:number;
    private verbose:boolean;
    constructor(real?: boolean, waitForAnotherTestMs = 1000*8, force?: PgTestableDbs, disposeOnComplete = true, verbose = false) {
        this.db = PgTestable.newDb(real, force, verbose);
        this.activeTests = [];
        this.testTableNameIndex = 0;
        this.disposed = false;
        this.started = false;
        this.waitForAnotherTestMs = waitForAnotherTestMs;
        this.keepAliveUntilTs = Date.now() + waitForAnotherTestMs;
        this.verbose = verbose;

        // It's complete when: no more tests have run + a time buffer has passed (a period in which a new test could be started)
        this.promiseComplete = new Promise<void>(accept => {
            const t = setInterval(async () => {
                const state = {
                    started: this.started, 
                    active_tests: this.activeTests.length,
                    keep_alive_until_ts: this.keepAliveUntilTs,
                    now: Date.now(),
                    time_remaining_ms: this.keepAliveUntilTs-Date.now()
                }
                if( this.verbose ) console.log(`DbMultipleTestsRunner evaluating...${JSON.stringify(state)}`);
                if( state.started && state.active_tests===0 && state.time_remaining_ms<0 ) {
                    clearInterval(t);
                    if( disposeOnComplete ) {
                        if( this.verbose ) console.warn(`DbMultipleTestsRunner disposing...${JSON.stringify(state)}`);
                        await this.dispose();
                    }
                    accept();
                }
            }, 1000);
        })
    }


    async sequentialTest<T>(callback:(runner: DbMultipleTestsRunner, db:PgTestableInstance<any>, uniqueTableName:string) => Promise<T>, tag: string = ''):Promise<T>{
        this.start();
        // pglite seemingly can't cope with creating and selecting multiple tables in an interleaving manner. Or possibly it just wants to run all its creates first (we could do this as a test set up).
        const release = this.lockAliveForTest();
        return queue('DbMulitpleTestsRunner.test-run', async () => {
            if( this.disposed) throw new Error(`DbMulitpleTestsRunner[${tag}] Database already disposed. Create a new runner.`);
            this.keepAlive();
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

    private start() {
        if( !this.started ) {
            if( this.verbose ) console.log(`DbMultipleTestsRunner start ${Date.now()}`);
            this.started = true;
        }
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
        this.start();
        return `test_${this.testTableNameIndex++}_table`;
    }

    private keepAlive() {
        
        const newEnd = Date.now()+this.waitForAnotherTestMs;
        const added = newEnd-this.keepAliveUntilTs;
        this.keepAliveUntilTs = newEnd;
        if( this.verbose ) console.log(`DbMultipleTestsRunner keep alive extended until...${this.keepAliveUntilTs} (added ${added}ms)`);
    }

    async isComplete() {
        return this.promiseComplete;
    }


}