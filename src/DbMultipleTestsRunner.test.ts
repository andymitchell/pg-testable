import { DbMultipleTestsRunner } from "./DbMultipleTestsRunner";

describe('DbMultipleTestsRunner', () => {

    const runner = new DbMultipleTestsRunner();

    test('simple query', async () => {
        const message = await runner.sequentialTest(async (runner, db) => {
            const result = await db.query("select 'Hello world' as message;");
            
            return result.rows[0].message;
        })

        expect(message).toBe('Hello world');
    })

    test('clean up', async () => {
        await runner.isComplete();
        expect(true).toBe(true);
    }, 1000*30)

})