import { PromiseWithTrigger, promiseWithTrigger } from "@andyrmitchell/utils";
import { PgTestableInstancePgClient } from ".";
import { standardTests } from "../../StandardTests"
import { PgTestableInstance } from "../../types";
import { PgTestableInstancePgMock } from "../pgmock";
import { PgTestable } from "../../PgTestable";

describe('PgTestableInstancePgClient', () => {

    
    let mock:PgTestableInstancePgMock;
    let dbLoading:PromiseWithTrigger = promiseWithTrigger<PgTestableInstance>();
    
    beforeAll(async () => {
        // Use PgMock as the test db (in the real world, it would be an actual postgres instance somewhere)
        mock = new PgTestableInstancePgMock();
        // Run query to make sure it sets up ok
        await mock.query("select 'Hello world' as message;");

        //const db = new PgTestableInstancePgClient(mock.getNodePostgresConfig());
        const db = new PgTestable({type: 'pg-client', config: mock.getNodePostgresConfig()})
        
        // Run the first query, which is always slow.
        await db.query("select 'Hello world' as message;");
        dbLoading.trigger(db);
    }, 1000*60*2);

    afterAll(async () => {
        await (await dbLoading.promise).dispose();
        await mock.dispose();
    }, 1000*60*2);

    standardTests(dbLoading, {'rls_should_work': true});

})