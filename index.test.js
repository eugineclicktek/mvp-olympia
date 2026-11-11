import test from "node:test";
import assert from "node:assert/strict";
import { user } from "./index.js";

test("invalid JSON gives 400 and leaks nothing", async () => {
  const res = await user({ body: "{not valid json", headers: { Authorization: "secret" } });
  assert.equal(res.statusCode, 400);
  assert.equal(JSON.parse(res.body).message, "Request body is not valid JSON");
  assert.ok(!res.body.includes("secret") && !res.body.includes("not valid json{"));
  assert.ok(!res.body.includes("{not"));
});

test("valid JSON gives 200 without echoing the request", async () => {
  const res = await user({ body: '{"name":"a"}', headers: { Authorization: "secret" } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(Object.keys(JSON.parse(res.body)), ["message"]);
  assert.ok(!res.body.includes("secret") && !res.body.includes("name"));
});

test("missing, empty and non-string bodies do not throw", async () => {
  for (const e of [{}, { body: "" }, { body: 5 }, { body: {} }, undefined, null]) {
    const res = await user(e);
    assert.equal(res.statusCode, 400);
  }
  assert.equal((await user({ body: "" })).statusCode, 400);
  assert.equal(JSON.parse((await user({})).body).message, "Request body is required");
});

test("null, number and array JSON are accepted", async () => {
  for (const body of ["null", "123", "[]"]) {
    assert.equal((await user({ body })).statusCode, 200);
  }
});

test("base64 bodies are decoded", async () => {
  const body = Buffer.from('{"a":1}').toString("base64");
  assert.equal((await user({ body, isBase64Encoded: true })).statusCode, 200);
  assert.equal((await user({ body, isBase64Encoded: false })).statusCode, 400);
});
