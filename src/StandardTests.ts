
import { PromiseWithTrigger } from "@andyrmitchell/utils";
import { PgTestableInstance } from "./types";


export function standardTests(dbLoading:PromiseWithTrigger<PgTestableInstance>, options?: {rls_should_work?:boolean}) {
    test('simple query', async () => {
        const db = await dbLoading.promise;
        const result = await db.query("select 'Hello world' as message;");
        
        expect(result.rows[0]!.message).toBe('Hello world');
    })


    test('simple transaction query', async () => {
        const db = await dbLoading.promise;

        let message:any;
        await db.transaction(async tx => {
            const result = await tx.query("select 'Hello world' as message;");
            message = result.rows[0]!.message;
        })
        
        expect(message).toBe('Hello world');
    })

    test('tranaction rolls back ok', async () => {
        const st = Date.now();
        const db = await dbLoading.promise;
        
        await db.exec("CREATE TABLE tx_test_1 (id SERIAL PRIMARY KEY);"); // 9 seconds

        let error = false;
        try {
            await db.transaction(async tx => {
                
                await tx.query("INSERT INTO tx_test_1 () VALUES()");
                
                

                const result = await tx.query(`SELECT * FROM tx_test_1`);
                expect(result.rows.length).toBe(1);
                
                

                throw new Error("Trigger rollback");
            })
        } catch(e) {
            error = true;
        }
        expect(error).toBe(true);

        const result = await db.query(`SELECT * FROM tx_test_1`);
        expect(result.rows.length).toBe(0);
        

    }, 1000*60);

    test('RLS can '+(options?.rls_should_work? 'work' : 'NOT work'), async () => {
        const db = await dbLoading.promise;

        await db.exec("CREATE TABLE rls_1 (id SERIAL PRIMARY KEY, user_id INT);");
        try {
            await db.exec("ALTER TABLE rls_1 ENABLE ROW LEVEL SECURITY;");
        } catch(e) {
            expect(!!options?.rls_should_work).toBe(false);
            return;
        }
        await db.exec("ALTER TABLE rls_1 FORCE ROW LEVEL SECURITY;");
        await db.exec("CREATE ROLE my_role;");
        await db.exec("GRANT USAGE ON SCHEMA public TO my_role;");
        await db.exec("GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rls_1 TO my_role;");
        await db.exec("GRANT USAGE, UPDATE ON SEQUENCE rls_1_id_seq TO my_role;");
        await db.exec("GRANT SELECT ON TABLE pg_roles TO my_role;");
        

        

        const sql = `
CREATE POLICY "User Owns Object"
ON rls_1
FOR ALL
TO my_role
USING (
    user_id = 1
)
WITH CHECK (
    user_id = 1
);
        `.trim();
        await db.exec(sql);

        await db.exec("SET ROLE my_role;");

        //const resultBg1 = await db.query(`SELECT * FROM pg_roles WHERE rolname = current_user`);
        //console.log(resultBg1.rows);

        //const resultBg2 = await db.query(`SELECT table_schema, table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema');`);
        //console.log(resultBg2.rows);

        let error1 = false;
        try {
            await db.query("INSERT INTO rls_1 (user_id) VALUES(1)");
        } catch(e) {
            error1 = true;
        }
        
        const result1 = await db.query(`SELECT * FROM rls_1`);
        expect(result1.rows.length).toBe(1);

        let error2 = false;
        try {
            await db.query("INSERT INTO rls_1 (user_id) VALUES(2)");
        } catch(e) {
            error2 = true;
        }
        const result2 = await db.query(`SELECT * FROM rls_1`);

        if( options?.rls_should_work ) {
            expect(error2).toBe(true);
            expect(result2.rows.length).toBe(1);
        } else {
            expect(error2).toBe(false);
            expect(result2.rows.length).toBe(2);
        }

    }, 1000*60*5);
}