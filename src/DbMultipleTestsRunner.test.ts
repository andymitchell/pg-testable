import { DbMultipleTestsRunner } from "./DbMultipleTestsRunner";

describe('DbMultipleTestsRunner', () => {

    let runner:DbMultipleTestsRunner;
    
    beforeAll((done) => {
        runner = new DbMultipleTestsRunner();
        runner.sequentialTest(async (runner, db) => {
            await db.query("select 'Hello world' as message;");
            done();
        })
    });

    afterAll(async () => {
        await runner.dispose();
    })
    

    async function sleep(ms:number) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(null);
            }, ms);
        })
    }
    
    test('simple query', async () => {
        const message = await runner.sequentialTest(async (runner, db) => {
            const result = await db.query("select 'Hello world' as message;");
        
            return result.rows[0].message;
        })

        expect(message).toBe('Hello world');
    })

    async function runSlow(){
        const message = await runner.sequentialTest(async (runner, db) => {
            const result = await db.query("select 'Hello world' as message;");
            await sleep(200);
            return result.rows[0].message;
        });
        expect(message).toBe('Hello world');
    }

    test('run across multiple test 1', async () => {
        await runSlow();
    })
    test('run across multiple test 2', async () => {
        await runSlow();
    })

    test(`stays alive until dispose called`, async () => {
        const runner = new DbMultipleTestsRunner();

        
        setTimeout(async () => {
            await runner.dispose();
            expect(true).toBe(true);
        }, 100);

        await runner.isComplete();
    })

})