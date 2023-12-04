import { watch } from "data-of-loathing-etl";
import express from "express";
import { postgraphile } from "postgraphile";
import ConnectionFilterPlugin from "postgraphile-plugin-connection-filter";

// Start checking for data source updates every 15 minutes
await watch(15);

const app = express();

app
  .use(
    postgraphile(process.env.DATABASE_URL, "public", {
      watchPg: true,
      graphiql: true,
      enhanceGraphiql: true,
      appendPlugins: [ConnectionFilterPlugin],
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

app.listen(process.env.PORT || 3000);
