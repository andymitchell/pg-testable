import { PgTestable } from "./PgTestable";
import { PgTestableVirtual } from "./PgTestableVirtual";

describe('PgTestableVirtual', () => {

    test('schema creates', async () => {
        const provider = new PgTestable({type: 'pglite'});
        const db = new PgTestableVirtual(provider);

        const result = await db.query(`SELECT * FROM information_schema.schemata WHERE schema_name = $1`, [db.getSchema()]);
        expect(result.rows.length).toBe(1);

        provider.dispose();

    });

    test('schema disposes', async () => {
        const provider = new PgTestable({type: 'pglite'});
        const db = new PgTestableVirtual(provider);

        await db.dispose();

        const result = await db.query(`SELECT * FROM information_schema.schemata WHERE schema_name = $1`, [db.getSchema()]);
        expect(result.rows.length).toBe(0);

        provider.dispose();
        
    });

    test('no collision', async () => {
        const provider = new PgTestable({type: 'pglite'});
        const db1 = new PgTestableVirtual(provider);
        const db2 = new PgTestableVirtual(provider);

        await db1.exec(`CREATE TABLE ${db1.schemaScope('test1')} (name TEXT)`);
        await db2.exec(`CREATE TABLE ${db2.schemaScope('test1')} (name TEXT)`);

        await db1.query(`INSERT INTO ${db1.schemaScope('test1')} (name) VALUES ($1)`, ['Bob']);

        const result1 = await db1.query(`SELECT * FROM ${db1.schemaScope('test1')}`);
        expect(result1.rows.length).toBe(1);

        const result2 = await db1.query(`SELECT * FROM ${db2.schemaScope('test1')}`);
        expect(result2.rows.length).toBe(0);

        provider.dispose();
        
    });

})

