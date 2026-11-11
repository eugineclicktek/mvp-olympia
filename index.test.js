import test from "node:test";
import assert from "node:assert";
import { user } from "./index.js";

const call = (id) => user({ pathParameters: id === undefined ? undefined : { id } });

test("unknown id returns 404", async () => {
  const res = await call("999");
  assert.strictEqual(res.statusCode, 404);
  assert.deepStrictEqual(JSON.parse(res.body), { message: "User not found" });
});

test("known id returns 200 with the user and no event", async () => {
  const event = { pathParameters: { id: "1" }, headers: { authorization: "secret" } };
  const res = await user(event);
  assert.strictEqual(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.deepStrictEqual(body, { id: "1", name: "Ada Lovelace" });
  assert.ok(!("event" in body));
  assert.ok(!res.body.includes("secret"));
});

test("missing or empty id returns 400", async () => {
  for (const event of [undefined, {}, { pathParameters: {} }, { pathParameters: { id: "" } }, { pathParameters: { id: "  " } }]) {
    const res = await user(event);
    assert.strictEqual(res.statusCode, 400);
  }
});
