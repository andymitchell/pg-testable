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
        
            return result.rows[0]!.message;
        })

        expect(message).toBe('Hello world');
    })

    async function runSlow(){
        const message = await runner.sequentialTest(async (runner, db) => {
            const result = await db.query("select 'Hello world' as message;");
            await sleep(200);
            return result.rows[0]!.message;
        });
        expect(message).toBe('Hello world');
    }

    test('run across multiple test', async () => {
        const promises = [
            runSlow(),
            runSlow()
        ]
        await Promise.all(promises);
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
                message = result.rows[0]!.message;
            })
            return message;
        })

        expect(message).toBe('Hello world');
    })

    test('schema isolation', async () => {
        let schema1:string;

        let count:number | undefined;
        await runner.sequentialTest(async (runner, db, schemaName) => {
            
            schema1 = schemaName;
            await db.exec(`CREATE TABLE ${schemaName}.test1 (name TEXT)`);

            const result = await db.query(`SELECT * FROM ${schemaName}.test1`);
            count = result.rows.length;
  
        })
        expect(count).toBe(0);

        let schemaErrorCreate = false;
        let schemaErrorSelectTest1 = false;
        let schemaErrorSelectTest2 = false;
        await runner.sequentialTest(async (runner, db, schemaName, schemaScope) => {
            
            try {
                await db.exec(`CREATE TABLE ${schema1}.test2 (name TEXT)`);
            } catch(e) {
                schemaErrorCreate = true;
            }

            try {
                const result = await db.query(`SELECT * FROM ${schemaScope('test1')}`);
            } catch(e) {
                schemaErrorSelectTest1 = true;
            }

            try {
                const result = await db.query(`SELECT * FROM ${schema1}.test1`);
            } catch(e) {
                schemaErrorSelectTest2 = true;
            }
        })

        expect(schemaErrorCreate).toBe(true);
        expect(schemaErrorSelectTest1).toBe(true);
        expect(schemaErrorSelectTest2).toBe(true);
        
    })
})