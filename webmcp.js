(function() {
  "use strict";

  function registerTools() {
    var mc = navigator.modelContext;
    if (!mc) {
      return;
    }

    var abortController = new AbortController();

    function createToolDefinitions() {
      return [
        {
          name: "open_waitlist_form",
          description: "Open the waitlist signup form for Threshold AI.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false
          },
          execute: function() {
            var href = "https://docs.google.com/forms/d/e/1FAIpQLSfPXl53oUkbrs2l2d1Z4i7Bg7gdE1nyONxbHYSNrqHkU9PCjQ/viewform";
            window.open(href, "_blank", "noopener,noreferrer");
            return {
              ok: true,
              opened: href
            };
          }
        },
        {
          name: "navigate_site_section",
          description: "Navigate to a key section of the current page.",
          inputSchema: {
            type: "object",
            properties: {
              section: {
                type: "string",
                enum: ["technology", "architecture", "roi", "cta"]
              }
            },
            required: ["section"],
            additionalProperties: false
          },
          execute: function(input) {
            var sectionId = input.section;
            var node = document.getElementById(sectionId);
            if (!node) {
              return {
                ok: false,
                error: "Section not found"
              };
            }
            node.scrollIntoView({ behavior: "smooth", block: "start" });
            return {
              ok: true,
              section: sectionId
            };
          }
        }
      ];
    }

    var tools = createToolDefinitions();

    if (typeof mc.provideContext === "function") {
      try {
        mc.provideContext({ tools: tools });
      } catch (err) {}
    }

    if (typeof mc.registerTool === "function") {
      tools.forEach(function(tool) {
        try {
          mc.registerTool(tool, { signal: abortController.signal });
        } catch (err) {}
      });
    }

    window.addEventListener("beforeunload", function() {
      abortController.abort();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", registerTools);
  } else {
    registerTools();
  }
})();
