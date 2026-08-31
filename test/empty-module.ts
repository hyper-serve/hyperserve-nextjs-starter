// The `server-only` package throws on import outside a React Server Component
// build. Vitest has no such build, so it is aliased to this file in the config
// below. Without the alias, every test that reaches lib/hyperserve.ts fails at
// import time with an error that has nothing to do with the test.
export {};
