import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT ?? 4310);
const HOST = "127.0.0.1";
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
    const file = normalize(join(ROOT, pathname === "/" ? "index.html" : pathname));
    if (!file.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep) || !(await stat(file)).isFile()) throw new Error();
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-cache" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(PORT, HOST, () => console.log(`http://${HOST}:${PORT}`));
