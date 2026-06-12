const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const SIGNAL_URL = "https://data-fetcher-p8pv.onrender.com/api/users";
const YOZORA_USER_ID = "428375195573551114";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": MIME_TYPES[".json"],
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(body));
}

async function handleSignal(response) {
  try {
    const upstream = await fetch(SIGNAL_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000)
    });

    if (!upstream.ok) {
      throw new Error(`Signal upstream returned ${upstream.status}`);
    }

    const payload = await upstream.json();
    const users = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
    const yozora = Array.isArray(users)
      ? users.find((user) => user.userId === YOZORA_USER_ID)
      : null;

    if (!yozora) {
      return sendJson(response, 404, { error: "Yozora not found" });
    }

    const customStatus = yozora.activities?.find(
      (activity) =>
        activity.type === 4 || activity.name === "Custom Status"
    );

    return sendJson(response, 200, {
      avatarURL: yozora.avatarURL || null,
      username: yozora.username || "hoshimiya_yozora",
      nickname: yozora.nickname || null,
      status: yozora.status || "offline",
      customStatus: customStatus?.state || null,
      lastUpdated: yozora.lastUpdated || null
    });
  } catch (error) {
    console.error("Signal fetch failed:", error.message);
    return sendJson(response, 502, { error: "Signal unavailable" });
  }
}

function serveStatic(request, response) {
  const rawPath = request.url.split("?")[0];
  const requestPath = rawPath === "/" ? "/index.html" : rawPath;
  const decodedPath = decodeURIComponent(requestPath);
  const filePath = path.resolve(ROOT, `.${decodedPath}`);
  const isInsideRoot =
    filePath === ROOT || filePath.startsWith(`${ROOT}${path.sep}`);

  if (!isInsideRoot) {
    response.writeHead(403);
    return response.end("Forbidden");
  }

  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return response.end("Not found");
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

const server = http.createServer((request, response) => {
  if (request.url === "/api/yozora") {
    return handleSignal(response);
  }

  return serveStatic(request, response);
});

server.listen(PORT, HOST, () => {
  console.log(`Yozora is online at http://${HOST}:${PORT}`);
});
