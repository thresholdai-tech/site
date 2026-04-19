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
          name: "open_waitlist_email",
          description: "Open the waitlist compose flow for Threshold AI.",
          inputSchema: {
            type: "object",
            properties: {
              subject: {
                type: "string",
                description: "Optional email subject"
              }
            },
            additionalProperties: false
          },
          execute: function(input) {
            var subject = input && input.subject ? input.subject : "Waitlist";
            var href = "https://mail.google.com/mail/?view=cm&fs=1&to=info@thresholdai.tech&su=" + encodeURIComponent(subject);
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
