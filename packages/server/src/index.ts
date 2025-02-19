import { watch } from "data-of-loathing-etl";
import express from "express";
import pg from "pg";
import { postgraphile } from "postgraphile";
import ConnectionFilterPlugin from "postgraphile-plugin-connection-filter";
import cors from "cors";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

await pool.query(`
  DO
  $do$
  BEGIN
    IF EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'readonly_role'
    ) THEN
      RAISE NOTICE 'Role "readonly_role" already exists. Nice!';
    ELSE
      CREATE ROLE "readonly_role" LOGIN PASSWORD 'readonly_role';
    END IF;

    GRANT CONNECT ON DATABASE "postgres" TO "readonly_role";
    GRANT USAGE ON SCHEMA "public" TO "readonly_role";
    GRANT SELECT ON ALL TABLES IN SCHEMA "public" TO "readonly_role";
    GRANT SELECT ON ALL SEQUENCES IN SCHEMA "public" TO "readonly_role";
    ALTER DEFAULT PRIVILEGES IN SCHEMA "public" GRANT SELECT ON TABLES TO "readonly_role";
    ALTER DEFAULT PRIVILEGES IN SCHEMA "public" GRANT SELECT ON SEQUENCES TO "readonly_role";
  END
  $do$;
`);

// Start checking for data source updates every 15 minutes
await watch(15);

const app = express();

app
  .use(cors())
  .use(
    postgraphile(process.env.READONLY_DATABASE_URL, "public", {
      watchPg: true,
      graphiql: true,
      enhanceGraphiql: true,
      enableCors: true,
      appendPlugins: [ConnectionFilterPlugin],
      ownerConnectionString: process.env.DATABASE_URL,
      graphileBuildOptions: {
        connectionFilterRelations: true,
        connectionFilterComputedColumns: false,
        connectionFilterSetofFunctions: false,
        connectionFilterArrays: true,
        connectionFilterAllowedOperators: [
          "isNull",
          "equalTo",
          "notEqualTo",
          "lessThan",
          "lessThanOrEqualTo",
          "greaterThan",
          "greaterThanOrEqualTo",
          "in",
          "notIn",
          "anyEqualTo",
          "anyNotEqualTo",
        ],
      },
    }),
  )
  .get("/", (req, res) => {
    res.send("DATA OF LOATHING");
  });

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});
