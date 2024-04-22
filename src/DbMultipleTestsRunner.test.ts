import { DbMultipleTestsRunner } from "./DbMultipleTestsRunner";

describe('DbMultipleTestsRunner', () => {

    const runner = new DbMultipleTestsRunner(true, 300, undefined, true, true);

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
            await sleep(500);
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
    test('run across multiple test 3', async () => {
        await runSlow();
    })

    test('clean up', async () => {
        await runner.isComplete();
        expect(true).toBe(true);
    }, 1000*20)

})