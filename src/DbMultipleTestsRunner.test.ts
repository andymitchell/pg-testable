import { DbMultipleTestsRunner } from "./DbMultipleTestsRunner";

describe('DbMultipleTestsRunner', () => {

    let runner:DbMultipleTestsRunner;
    
    beforeAll((done) => {
        runner = new DbMultipleTestsRunner('any-real');
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
        const runner = new DbMultipleTestsRunner('any-real');

        
        setTimeout(async () => {
            await runner.dispose();
            expect(true).toBe(true);
        }, 100);

        await runner.isComplete();
    })

    test('simple transaction query', async () => {
        const message = await runner.sequentialTest(async (runner, db) => {
            let message:any;
            await db.transaction(async tx => {
                const result = await tx.query("select 'Hello world' as message;");
                message = result.rows[0].message;
            })
            return message;
        })

        expect(message).toBe('Hello world');
    })
})