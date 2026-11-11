import { findUserById } from "./users.js";

// Single place that decides how the user id arrives in the event.
function getUserId(event) {
  const id = event?.pathParameters?.id;
  return typeof id === "string" ? id.trim() : "";
}

function respond(statusCode, payload) {
  return { statusCode, body: JSON.stringify(payload) };
}

export async function user(event) {
  const id = getUserId(event);
  if (!id) {
    return respond(400, { message: "Missing user id" });
  }

  const found = await findUserById(id);
  if (!found) {
    return respond(404, { message: "User not found" });
  }

  return respond(200, found);
}
