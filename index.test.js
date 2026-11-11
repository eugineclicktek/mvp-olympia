import test from "node:test";
import assert from "node:assert";
import { user, health } from "./index.js";

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

test("null pathParameters or non-string id returns 400", async () => {
  for (const event of [{ pathParameters: null }, { pathParameters: { id: 1 } }, { pathParameters: { id: null } }]) {
    const res = await user(event);
    assert.strictEqual(res.statusCode, 400);
    assert.deepStrictEqual(JSON.parse(res.body), { message: "Missing user id" });
  }
});

test("invalid JSON body returns 400 without leaking the event", async () => {
  const event = { pathParameters: { id: "1" }, body: "{not valid json", headers: { authorization: "secret" } };
  const res = await user(event);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(JSON.parse(res.body), { message: "Request body is not valid JSON" });
  assert.ok(!res.body.includes("secret"));
  assert.ok(!res.body.includes("not valid json"));
});

test("body is validated before the id lookup", async () => {
  for (const pathParameters of [undefined, { id: "999" }]) {
    const res = await user({ pathParameters, body: "{bad" });
    assert.strictEqual(res.statusCode, 400);
    assert.deepStrictEqual(JSON.parse(res.body), { message: "Request body is not valid JSON" });
  }
});

test("valid JSON bodies with a known id return 200", async () => {
  for (const body of ['{"name":"a"}', "null", "123", "[]"]) {
    const res = await user({ pathParameters: { id: "1" }, body });
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(JSON.parse(res.body), { id: "1", name: "Ada Lovelace" });
  }
});

test("missing or empty body keeps existing behaviour", async () => {
  for (const body of [undefined, ""]) {
    const ok = await user({ pathParameters: { id: "1" }, body });
    assert.strictEqual(ok.statusCode, 200);
    const missing = await user({ body });
    assert.strictEqual(missing.statusCode, 400);
    assert.deepStrictEqual(JSON.parse(missing.body), { message: "Missing user id" });
  }
});

test("base64 body is decoded before parsing", async () => {
  const enc = (s) => Buffer.from(s).toString("base64");
  const good = await user({ pathParameters: { id: "1" }, body: enc('{"a":1}'), isBase64Encoded: true });
  assert.strictEqual(good.statusCode, 200);
  const bad = await user({ pathParameters: { id: "1" }, body: enc("{bad"), isBase64Encoded: true });
  assert.strictEqual(bad.statusCode, 400);
});

test("health returns 200 with ok true", async () => {
  const res = await health();
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(JSON.parse(res.body), { ok: true });
});
