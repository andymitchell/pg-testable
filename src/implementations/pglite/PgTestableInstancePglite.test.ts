import { PromiseWithTrigger, promiseWithTrigger } from "@andyrmitchell/utils";
import { PgTestableInstancePglite } from ".";
import { standardTests } from "../../StandardTests"
import { PgTestableInstance } from "../../types";


describe('PgTestableInstancePglite', () => {

    
    let dbLoading:PromiseWithTrigger<PgTestableInstance<any>> = promiseWithTrigger<PgTestableInstance<any>>();
    
    beforeAll(async () => {
        const st = Date.now();
        const db = new PgTestableInstancePglite('node');
        const dur = Date.now()-st; // Instant

        // Run the first query, which is always slow.
        await db.query("select 'Hello world' as message;");
        dbLoading.trigger(db);
    }, 1000*10);

    afterAll(async () => {
        await (await dbLoading.promise).dispose();
    })

    standardTests(dbLoading);

    
})