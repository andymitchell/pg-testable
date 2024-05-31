import { PromiseWithTrigger, promiseWithTrigger } from "@andyrmitchell/utils";
import { PgTestableInstancePgMock } from ".";
import { standardTests } from "../../StandardTests"
import { PgTestableInstance } from "../../types";

/**
 * The initial load - before even 'beforeAll' runs - seems to be about 50 seconds: presumably to download and build PgMock.
 */

describe('PgTestableInstancePgMock', () => {

    
    let dbLoading:PromiseWithTrigger = promiseWithTrigger<PgTestableInstance>();
    
    beforeAll(async () => {
        const st = Date.now();
        const db = new PgTestableInstancePgMock();
        const dur = Date.now()-st; // Instant

        // Run the first query, which is always slow.
        await db.query("select 'Hello world' as message;");
        dbLoading.trigger(db);
    }, 1000*20);

    afterAll(async () => {
        await (await dbLoading.promise).dispose();
    }, 1000*20);

    standardTests(dbLoading, {'rls_should_work': true});

})