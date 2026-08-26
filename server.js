const { createServer } = require("http");
const { parse } = require("url");
const path = require("path");
const next = require("next");

// Ensure relative imports (next.config, .next) resolve from the app root on cPanel.
process.chdir(__dirname);

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number(process.env.PORT) || 3000;

const app = next({
  dev,
  hostname,
  port,
  dir: path.join(__dirname),
});
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res, parse(req.url, true));
    }).listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start Next.js server:", err);
    process.exit(1);
  });
