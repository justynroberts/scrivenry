#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Configuration from environment variables
const SCRIVENRY_URL = process.env.SCRIVENRY_URL || "http://localhost:3847";
const SCRIVENRY_API_KEY = process.env.SCRIVENRY_API_KEY || "";

interface ApiError {
  error: string;
  message?: string;
}

interface Page {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  title: string;
  icon: string | null;
  cover: string | null;
  path: string[];
  depth: number;
  position: number;
  is_template: boolean;
  properties: Record<string, unknown>;
  content?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface ListPagesResponse {
  pages: Page[];
  has_more: boolean;
  next_cursor: string | null;
}

interface PageResponse {
  page: Page;
}

interface SearchResult {
  type: string;
  id: string;
  title: string;
  icon: string | null;
  path: string[];
  workspace_id: string;
  highlight: string;
  score: number;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  took_ms: number;
}

async function apiRequest<T>(
  endpoint: string,
  method: string = "GET",
  body?: unknown
): Promise<T> {
  if (!SCRIVENRY_API_KEY) {
    throw new Error(
      "SCRIVENRY_API_KEY environment variable is required. Create an API key in Scrivenry Settings > API Keys."
    );
  }

  const url = `${SCRIVENRY_URL}/api/v1${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${SCRIVENRY_API_KEY}`,
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    const error = data as ApiError;
    throw new Error(error.message || error.error || `API error: ${response.status}`);
  }

  return data as T;
}

// Define tools
const tools: Tool[] = [
  {
    name: "scrivenry_list_pages",
    description:
      "List all pages in Scrivenry. Returns page titles, IDs, and metadata. Use this to browse available documents.",
    inputSchema: {
      type: "object",
      properties: {
        workspace_id: {
          type: "string",
          description: "Optional workspace ID to filter pages",
        },
        parent_id: {
          type: "string",
          description: "Optional parent page ID to list child pages",
        },
        limit: {
          type: "number",
          description: "Maximum number of pages to return (default: 50)",
        },
      },
    },
  },
  {
    name: "scrivenry_get_page",
    description:
      "Get a specific page by ID, including its full content. Use this to read document contents.",
    inputSchema: {
      type: "object",
      properties: {
        page_id: {
          type: "string",
          description: "The ID of the page to retrieve",
        },
      },
      required: ["page_id"],
    },
  },
  {
    name: "scrivenry_create_page",
    description:
      "Create a new page/document in Scrivenry. Returns the created page with its ID.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The title of the new page",
        },
        icon: {
          type: "string",
          description: "Optional emoji icon for the page (e.g., '📄')",
        },
        parent_id: {
          type: "string",
          description: "Optional parent page ID to create as a child page",
        },
        workspace_id: {
          type: "string",
          description: "Workspace ID (uses default if not specified)",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "scrivenry_update_page",
    description:
      "Update an existing page's title, icon, or content.",
    inputSchema: {
      type: "object",
      properties: {
        page_id: {
          type: "string",
          description: "The ID of the page to update",
        },
        title: {
          type: "string",
          description: "New title for the page",
        },
        icon: {
          type: "string",
          description: "New emoji icon for the page",
        },
        content: {
          type: "string",
          description: "New content for the page (plain text - will be converted to TipTap format)",
        },
      },
      required: ["page_id"],
    },
  },
  {
    name: "scrivenry_search",
    description:
      "Search for pages by title or content. Returns matching pages with highlights.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query string",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 20)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "scrivenry_delete_page",
    description:
      "Delete a page. By default performs a soft delete (moves to trash).",
    inputSchema: {
      type: "object",
      properties: {
        page_id: {
          type: "string",
          description: "The ID of the page to delete",
        },
        permanent: {
          type: "boolean",
          description: "If true, permanently delete instead of moving to trash",
        },
      },
      required: ["page_id"],
    },
  },
];

// Convert plain text to TipTap document format
function textToTipTap(text: string): Record<string, unknown> {
  const paragraphs = text.split("\n\n").filter(p => p.trim());

  return {
    type: "doc",
    content: paragraphs.length > 0
      ? paragraphs.map(p => ({
          type: "paragraph",
          content: [{ type: "text", text: p.trim() }]
        }))
      : [{ type: "paragraph" }]
  };
}

// Extract plain text from TipTap content
function tipTapToText(content: Record<string, unknown>): string {
  if (!content || !content.content) return "";

  const extractText = (node: Record<string, unknown>): string => {
    if (node.type === "text" && typeof node.text === "string") {
      return node.text;
    }
    if (Array.isArray(node.content)) {
      return node.content.map(extractText).join("");
    }
    return "";
  };

  if (Array.isArray(content.content)) {
    return content.content.map(extractText).join("\n\n");
  }
  return "";
}

// Create server
const server = new Server(
  {
    name: "scrivenry-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "scrivenry_list_pages": {
        const params = new URLSearchParams();
        if (args?.workspace_id) params.set("workspace_id", String(args.workspace_id));
        if (args?.parent_id) params.set("parent_id", String(args.parent_id));
        if (args?.limit) params.set("limit", String(args.limit));

        const queryString = params.toString();
        const endpoint = `/pages${queryString ? `?${queryString}` : ""}`;
        const result = await apiRequest<ListPagesResponse>(endpoint);

        const pageList = result.pages.map(p =>
          `- ${p.icon || "📄"} ${p.title} (ID: ${p.id})${p.parent_id ? " [child]" : ""}`
        ).join("\n");

        return {
          content: [
            {
              type: "text",
              text: `Found ${result.pages.length} pages:\n\n${pageList}`,
            },
          ],
        };
      }

      case "scrivenry_get_page": {
        if (!args?.page_id) {
          throw new Error("page_id is required");
        }

        const result = await apiRequest<PageResponse>(
          `/pages/${args.page_id}?include_blocks=true`
        );

        const page = result.page;
        const content = page.content ? tipTapToText(page.content) : "(empty)";

        return {
          content: [
            {
              type: "text",
              text: `# ${page.icon || ""} ${page.title}\n\n**ID:** ${page.id}\n**Created:** ${page.created_at}\n**Updated:** ${page.updated_at}\n\n---\n\n${content}`,
            },
          ],
        };
      }

      case "scrivenry_create_page": {
        if (!args?.title) {
          throw new Error("title is required");
        }

        // Get default workspace if not provided
        let workspaceId = args.workspace_id as string | undefined;
        if (!workspaceId) {
          const pages = await apiRequest<ListPagesResponse>("/pages?limit=1");
          if (pages.pages.length > 0) {
            workspaceId = pages.pages[0].workspace_id;
          } else {
            throw new Error("No workspace found. Please specify workspace_id.");
          }
        }

        const body: Record<string, unknown> = {
          workspace_id: workspaceId,
          title: args.title,
        };
        if (args.icon) body.icon = args.icon;
        if (args.parent_id) body.parent_id = args.parent_id;

        const result = await apiRequest<PageResponse>("/pages", "POST", body);

        return {
          content: [
            {
              type: "text",
              text: `Created page "${result.page.title}" with ID: ${result.page.id}`,
            },
          ],
        };
      }

      case "scrivenry_update_page": {
        if (!args?.page_id) {
          throw new Error("page_id is required");
        }

        const body: Record<string, unknown> = {};
        if (args.title) body.title = args.title;
        if (args.icon) body.icon = args.icon;
        if (args.content) {
          body.content = textToTipTap(String(args.content));
        }

        if (Object.keys(body).length === 0) {
          throw new Error("At least one of title, icon, or content must be provided");
        }

        const result = await apiRequest<PageResponse>(
          `/pages/${args.page_id}`,
          "PATCH",
          body
        );

        return {
          content: [
            {
              type: "text",
              text: `Updated page "${result.page.title}" (ID: ${result.page.id})`,
            },
          ],
        };
      }

      case "scrivenry_search": {
        if (!args?.query) {
          throw new Error("query is required");
        }

        const params = new URLSearchParams({ q: String(args.query) });
        if (args.limit) params.set("limit", String(args.limit));

        const result = await apiRequest<SearchResponse>(`/search?${params}`);

        if (result.results.length === 0) {
          return {
            content: [{ type: "text", text: "No results found." }],
          };
        }

        const resultList = result.results.map(r =>
          `- ${r.icon || "📄"} ${r.title} (ID: ${r.id})\n  Match: ${r.highlight}`
        ).join("\n");

        return {
          content: [
            {
              type: "text",
              text: `Found ${result.total} results:\n\n${resultList}`,
            },
          ],
        };
      }

      case "scrivenry_delete_page": {
        if (!args?.page_id) {
          throw new Error("page_id is required");
        }

        const permanent = args.permanent ? "?permanent=true" : "";
        await apiRequest<{ success: boolean }>(
          `/pages/${args.page_id}${permanent}`,
          "DELETE"
        );

        return {
          content: [
            {
              type: "text",
              text: `Page ${args.page_id} has been ${args.permanent ? "permanently deleted" : "moved to trash"}.`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Scrivenry MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
