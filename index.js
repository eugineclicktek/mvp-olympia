const respond = (statusCode, message) => ({
  statusCode,
  body: JSON.stringify({ message }),
});

export async function user(event) {
  let raw = event?.body;
  if (raw === undefined || raw === null || raw === "") {
    return respond(400, "Request body is required");
  }
  try {
    if (typeof raw !== "string") throw new TypeError("body must be a string");
    if (event.isBase64Encoded) raw = Buffer.from(raw, "base64").toString("utf8");
    JSON.parse(raw);
  } catch {
    return respond(400, "Request body is not valid JSON");
  }
  return respond(200, "Go Serverless v2.0! Your function executed successfully!");
}
