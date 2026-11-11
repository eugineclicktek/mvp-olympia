// In-memory stand-in for a user store. Replace findUserById with a real source later.
const users = new Map([
  ["1", { id: "1", name: "Ada Lovelace" }],
  ["2", { id: "2", name: "Grace Hopper" }],
]);

export async function findUserById(id) {
  return users.get(id) ?? null;
}
