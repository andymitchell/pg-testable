import { PromiseWithTrigger, promiseWithTrigger } from "@andyrmitchell/utils";
import { PgTestableInstancePgMock } from ".";
import { standardTests } from "../../StandardTests"
import { PgTestableInstance } from "../../types";

/**
 * The initial load - before even 'beforeAll' runs - seems to be about 50 seconds: presumably to download and build PgMock.
 */

describe('PgTestableInstancePgMock', () => {

    
    let dbLoading:PromiseWithTrigger = promiseWithTrigger<PgTestableInstance<any>>();
    
    beforeAll(async () => {
        const st = Date.now();
        const db = new PgTestableInstancePgMock();
        const dur = Date.now()-st; // Instant

        // Run the first query, which is always slow.
        await db.query("select 'Hello world' as message;");
        dbLoading.trigger(db);
    }, 1000*10);

    afterAll(async () => {
        await (await dbLoading.promise).dispose();
    })

    standardTests(dbLoading, {'rls_should_work': true});

})