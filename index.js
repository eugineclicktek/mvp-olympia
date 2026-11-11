import { findUserById } from "./users.js";

// Single place that decides how the user id arrives in the event.
function getUserId(event) {
  const id = event?.pathParameters?.id;
  return typeof id === "string" ? id.trim() : "";
}

function respond(statusCode, payload) {
  return { statusCode, body: JSON.stringify(payload) };
}

// Only checks that a present body parses; the handler uses no body fields.
function hasValidBody(event) {
  const raw = event?.body;
  if (raw === undefined || raw === null || raw === "") return true;
  try {
    const text = event.isBase64Encoded
      ? Buffer.from(String(raw), "base64").toString("utf8")
      : raw;
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

export async function user(event) {
  if (!hasValidBody(event)) {
    return respond(400, { message: "Request body is not valid JSON" });
  }

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
