const http = require("http");
const fs = require("fs");
const path = require("path");

const mimes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml"
};

const root = __dirname;
const port = 8765;

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const safePath = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.join(root, safePath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": mimes[ext] || "application/octet-stream",
    "Cache-Control": "no-cache",
    "Access-Control-Allow-Origin": "*"
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
