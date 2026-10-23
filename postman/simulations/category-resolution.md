# Category resolution regression check

The local simulation models only the read paths used by expenses, limits and category resolution.
Fixtures follow the repository's Zod contracts and contain no real user data. Unmodeled endpoints return 501.
No published owner mock was used; this is a focused fixture for the existing local API contract.

Requires Postman CLI 1.70+ and the installed project dependencies.

Start the simulation in one terminal:

```sh
postman simulation run postman/simulations/category-resolution.sim.yaml --port 4900 --output ndjson
```

Run the actual API clients over HTTP in another terminal:

```sh
FRONT_BASE_API_URL=http://localhost/api FRONT_USE_LOCAL_AUTH_TOKEN=false node --test \
  src/entities/expenses/api/category-resolution.test.mjs \
  src/entities/expenses/api/space-category.test.mjs
```

`BABKI_CATEGORY_SIM_URL` optionally changes the test target (default `http://127.0.0.1:4900/budget`).
This is a focused command, not a repository-wide test runner.

The tests cover a shared category list for 20 expenses and two limits, existing list cache reuse,
one fallback request per missing category ID, list failure, missing-category behavior, cache isolation
by user and space, invalidation, archived historical categories and cancellation of one consumer.
The simulation request log and `/budget/requests` expose the HTTP requests used by these checks.
Stop the simulation with Ctrl+C and restart it after modifying fixtures.
