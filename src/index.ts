import express from "express";
import { postgraphile } from "postgraphile";
import ConnectionFilterPlugin from "postgraphile-plugin-connection-filter";

const app = express();

app.use(
  postgraphile(
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432",
    "public",
    {
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
    },
  ),
);

app.listen(process.env.PORT || 3000);
