import type { Response } from "express";

export function htmlRedirect(res: Response, url: string, title: string = "NetworkCloud"): void {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="robots" content="noindex">
</head>
<body>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${url}">
    <p>Redirecting to <a href="${url}">${url}</a></p>
  </noscript>
  <script>window.location.replace("${url}");</script>
</body>
</html>`);
}
