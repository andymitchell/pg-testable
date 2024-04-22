# Postgres Testable

Pg-testable is a thin wrapper with a common interface around various locally testable Postgres implementations.
- [Pglite](https://www.npmjs.com/package/@electric-sql/pglite) is Postgres implemented as WASM. 
- [Pg-mem](https://www.npmjs.com/package/pg-mem) Lightning fast, but it's an interpretation of Postgres' syntax. Useful only for very basic tests. 

It also attempts to load optimally in different environments. 

It includes DbMultipleTestsRunner to execute many tests independentally of one another, in just one DB instance (dramatically speeding it up vs. creating a new DB per test). It does this simply by giving each test its own unique table name.

# Sample usage

The wrapped db: useful as a common interface and sensible default environment choices

```javascript
const db = Pgtestable.newDb();
await db.exec('CREATE TABLE IF NOT EXISTS t1 (pk SERIAL PRIMARY KEY)');
await db.exec('INSERT INTO t1 () VALUES()');
const result = await db.query<{pk:string}>('SELECT * FROM t1');
result.rows[0].pk;
```

The test runner: useful as it efficiently reuses the DB across mutiple tests, then automatically cleans up the database when all tests have finished


```javascript
const runner = new DbMultipleTestsRunner();

test('simple query', async () => {
    const message = await runner.sequentialTest(async (runner, db, uniqueTableName) => {
        const result = await db.query("select 'Hello world' as message;");
        
        return result.rows[0].message;
    })

    expect(message).toBe('Hello world');
})

test('clean up', async () => {
    // isComplete resolves after all active tests are finished + a buffer (to prove no other tests want to start)
    await runner.isComplete();
    expect(true).toBe(true);
})
```



# API Reference

## Pgtestable

#### `static .newDb<T>(real: boolean = true, force?: PgTestableDbs): PgTestableInstance<T>`

-   `real:boolean`
    Use a real database (i.e. not pg-mem)
-   `force:PgTestableDbs`
    Override environmental selectors to pick the database

## PgTestableInstance

#### `.exec(query: string): Promise<void>`

#### `.query<T>(query: string, params?: any[], options?: QueryOptions): Promise<Results<T>>`


# Roadmap

## Drop the need for dynamic loading Pglite in browser (currently needed for [Trowser](https://www.npmjs.com/package/@andyrmitchell/trowser))

If it detects it's running in the browser, it dynamically loads the Pglite module. This can probably change in the future, but it was the only way to get it correctly load paths for the WASM files (Pglite's author has stated the WASM file paths will become optional, at which point it would be wise to point to the CDN for them, or update Trowser to have a special hotfix mode that includes the Postgres wasm files into the temp directory).

# Troubleshooting

## Pglite claims a table/relation doesn't exist, but you created it and awaited it to complete

For some reason, if you try to create/select multiple tables in an interleaved way (e.g. two async functions running together), Pglite fails to recognise the table. 

DbMultipleTestsRunner solves this by queuing each test to run sequentially. 

# Building 

## Testing code that imports ESM modules

In jest.config.js
- Add the package to transformIgnorePatterns
- If the package uses import.meta.url (Jest will throw an error if it does and you've not set this up), make sure you've installed and set up https://github.com/javiertury/babel-plugin-transform-import-meta. FYI this package now has it installed and set up in babel.config.js. 

## Releasing 

- `npm run build_release` Will run the lint (failing if it gives any warnings), build it, and deploy with np
