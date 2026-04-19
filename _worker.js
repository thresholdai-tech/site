const MARKDOWN_PATHS = {
  "/": "/index.md",
  "/index.html": "/index.md",
  "/tr.html": "/tr.md"
};

const HOMEPAGE_PATHS = new Set(["/", "/index.html"]);

const CONTENT_TYPE_OVERRIDES = {
  "/robots.txt": "text/plain; charset=utf-8",
  "/sitemap.xml": "application/xml; charset=utf-8",
  "/.well-known/api-catalog": "application/linkset+json; profile=\"https://www.rfc-editor.org/info/rfc9727\"",
  "/.well-known/openid-configuration": "application/json; charset=utf-8",
  "/.well-known/oauth-authorization-server": "application/json; charset=utf-8",
  "/.well-known/oauth-protected-resource": "application/json; charset=utf-8",
  "/.well-known/mcp/server-card.json": "application/json; charset=utf-8",
  "/.well-known/agent-skills/index.json": "application/json; charset=utf-8",
  "/openapi.json": "application/vnd.oai.openapi+json; charset=utf-8",
  "/api/health": "application/json; charset=utf-8",
  "/index.md": "text/markdown; charset=utf-8",
  "/tr.md": "text/markdown; charset=utf-8"
};

function wantsMarkdown(request) {
  const accept = request.headers.get("accept") || "";
  return accept.toLowerCase().includes("text/markdown");
}

function estimateTokens(markdownText) {
  return Math.max(1, Math.ceil(markdownText.length / 4));
}

function addDiscoveryLinkHeaders(headers) {
  headers.append("Link", '</.well-known/api-catalog>; rel="api-catalog"');
  headers.append("Link", '</openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"');
  headers.append("Link", '</docs/api/>; rel="service-doc"; type="text/html"');
  headers.append("Link", '</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"');
}

function withHeaders(response, pathname) {
  const headers = new Headers(response.headers);

  if (HOMEPAGE_PATHS.has(pathname)) {
    addDiscoveryLinkHeaders(headers);
  }

  if (pathname === "/.well-known/api-catalog") {
    addDiscoveryLinkHeaders(headers);
  }

  const contentType = CONTENT_TYPE_OVERRIDES[pathname];
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function fetchStaticAsset(request, env, pathname) {
  if (!env.ASSETS || typeof env.ASSETS.fetch !== "function") {
    return new Response("Static asset binding is not configured", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const response = await env.ASSETS.fetch(request);
  return withHeaders(response, pathname);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method !== "GET" && request.method !== "HEAD") {
      return fetchStaticAsset(request, env, pathname);
    }

    const markdownPath = MARKDOWN_PATHS[pathname];
    if (markdownPath && wantsMarkdown(request)) {
      const markdownUrl = new URL(markdownPath, url.origin);
      const markdownRequest = new Request(markdownUrl.toString(), request);
      const markdownResponse = await fetchStaticAsset(markdownRequest, env, markdownPath);

      if (markdownResponse.ok) {
        if (request.method === "HEAD") {
          const headHeaders = new Headers(markdownResponse.headers);
          headHeaders.set("Content-Type", "text/markdown; charset=utf-8");
          headHeaders.set("x-markdown-tokens", "0");
          if (HOMEPAGE_PATHS.has(pathname)) {
            addDiscoveryLinkHeaders(headHeaders);
          }
          return new Response(null, {
            status: markdownResponse.status,
            statusText: markdownResponse.statusText,
            headers: headHeaders
          });
        }

        const markdownText = await markdownResponse.text();
        const headers = new Headers(markdownResponse.headers);
        headers.set("Content-Type", "text/markdown; charset=utf-8");
        headers.set("x-markdown-tokens", String(estimateTokens(markdownText)));
        if (HOMEPAGE_PATHS.has(pathname)) {
          addDiscoveryLinkHeaders(headers);
        }

        return new Response(markdownText, {
          status: markdownResponse.status,
          statusText: markdownResponse.statusText,
          headers
        });
      }
    }

    return fetchStaticAsset(request, env, pathname);
  }
};
