#!/usr/bin/env node
// MIT License - Copyright (c) fintonlabs.com

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

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  image_url: string | null;
  video_url: string | null;
  link_url: string | null;
  link_text: string | null;
  metadata: Record<string, unknown>;
  page_id: string | null;
  status: string;
  snoozed_until: string | null;
  created_at: string;
  read_at: string | null;
  archived_at: string | null;
}

interface ListNotificationsResponse {
  notifications: Notification[];
  unread_count: number;
  has_more: boolean;
  next_cursor: string | null;
}

interface NotificationResponse {
  notification: Notification;
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
  // Page tools
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
          description: "Optional parent page ID to list child pages. Use 'null' for root pages only.",
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
        content: {
          type: "string",
          description: "Optional content for the page (markdown string - will be converted to TipTap format)",
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
        cover: {
          type: "string",
          description: "New cover image URL for the page",
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
        workspace_id: {
          type: "string",
          description: "Optional workspace ID to filter search results",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 20, max: 100)",
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
  {
    name: "scrivenry_move_page",
    description:
      "Move a page to a new parent (organize into folders). Set parent_id to null to move to root.",
    inputSchema: {
      type: "object",
      properties: {
        page_id: {
          type: "string",
          description: "The ID of the page to move",
        },
        parent_id: {
          type: "string",
          description: "The ID of the new parent page (folder), or null for root level",
        },
      },
      required: ["page_id"],
    },
  },
  // Notification tools
  {
    name: "scrivenry_list_notifications",
    description:
      "List notifications for the current user. Can filter by status (unread, read, snoozed, accepted, archived, active, all).",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Filter by status: 'unread', 'read', 'snoozed', 'accepted', 'archived', 'active' (non-archived), or 'all'",
          enum: ["unread", "read", "snoozed", "accepted", "archived", "active", "all"],
        },
        limit: {
          type: "number",
          description: "Maximum number of notifications to return (default: 50)",
        },
      },
    },
  },
  {
    name: "scrivenry_get_notification",
    description:
      "Get a specific notification by ID.",
    inputSchema: {
      type: "object",
      properties: {
        notification_id: {
          type: "string",
          description: "The ID of the notification to retrieve",
        },
      },
      required: ["notification_id"],
    },
  },
  {
    name: "scrivenry_create_notification",
    description:
      "Create a new notification with optional rich content (images, videos, links).",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Notification title (required)",
        },
        message: {
          type: "string",
          description: "Notification message/body",
        },
        type: {
          type: "string",
          description: "Notification type (default: 'custom')",
        },
        image_url: {
          type: "string",
          description: "URL of an image to display",
        },
        video_url: {
          type: "string",
          description: "URL of a video to embed",
        },
        link_url: {
          type: "string",
          description: "URL for the notification link",
        },
        link_text: {
          type: "string",
          description: "Text for the notification link",
        },
        page_id: {
          type: "string",
          description: "Related page ID for navigation",
        },
        metadata: {
          type: "object",
          description: "Custom metadata object",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "scrivenry_update_notification",
    description:
      "Update a notification's status. Actions: read, unread, snooze, accept, archive, unarchive.",
    inputSchema: {
      type: "object",
      properties: {
        notification_id: {
          type: "string",
          description: "The ID of the notification to update",
        },
        action: {
          type: "string",
          description: "Action to perform: 'read', 'unread', 'snooze', 'accept', 'archive', 'unarchive'",
          enum: ["read", "unread", "snooze", "accept", "archive", "unarchive"],
        },
        snoozed_until: {
          type: "string",
          description: "ISO 8601 timestamp for snooze end time (required for 'snooze' action)",
        },
      },
      required: ["notification_id", "action"],
    },
  },
  {
    name: "scrivenry_delete_notification",
    description:
      "Permanently delete a notification.",
    inputSchema: {
      type: "object",
      properties: {
        notification_id: {
          type: "string",
          description: "The ID of the notification to delete",
        },
      },
      required: ["notification_id"],
    },
  },
];

// Check if a line is a table separator (|---|---|)
function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return false;
  // Match separator patterns like |---|---|, |:---:|---:|, etc.
  return /^\|?[\s\-:|]+\|?$/.test(trimmed) && trimmed.includes('-');
}

// Check if a line looks like a table row
function isTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.includes('|') && !isTableSeparator(line);
}

// Parse a table row into cells
function parseTableRow(line: string): string[] {
  let trimmed = line.trim();
  // Remove leading/trailing pipes if present
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split('|').map(cell => cell.trim());
}

// Convert markdown to TipTap document format
function markdownToTipTap(markdown: string): Record<string, unknown> {
  const lines = markdown.split('\n');
  const content: Record<string, unknown>[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      content.push({
        type: 'codeBlock',
        attrs: { language: lang || null },
        content: [{ type: 'text', text: codeLines.join('\n') }]
      });
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      content.push({
        type: 'heading',
        attrs: { level },
        content: parseInlineMarks(headingMatch[2])
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      content.push({
        type: 'blockquote',
        content: [{
          type: 'paragraph',
          content: parseInlineMarks(quoteLines.join(' '))
        }]
      });
      continue;
    }

    // Task list (- [ ] or - [x])
    if (line.match(/^[-*]\s+\[[ xX]\]\s+/)) {
      const items: Record<string, unknown>[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s+\[[ xX]\]\s+/)) {
        const isChecked = /^[-*]\s+\[[xX]\]/.test(lines[i]);
        const itemText = lines[i].replace(/^[-*]\s+\[[ xX]\]\s+/, '');
        items.push({
          type: 'taskItem',
          attrs: { checked: isChecked },
          content: [{
            type: 'paragraph',
            content: parseInlineMarks(itemText)
          }]
        });
        i++;
      }
      content.push({ type: 'taskList', content: items });
      continue;
    }

    // Unordered list
    if (line.match(/^[-*]\s+/)) {
      const items: Record<string, unknown>[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s+/) && !lines[i].match(/^[-*]\s+\[[ xX]\]/)) {
        const itemText = lines[i].replace(/^[-*]\s+/, '');
        items.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: parseInlineMarks(itemText)
          }]
        });
        i++;
      }
      content.push({ type: 'bulletList', content: items });
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\.\s+/)) {
      const items: Record<string, unknown>[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        const itemText = lines[i].replace(/^\d+\.\s+/, '');
        items.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: parseInlineMarks(itemText)
          }]
        });
        i++;
      }
      content.push({ type: 'orderedList', content: items });
      continue;
    }

    // Table (GFM style) - improved detection
    if (isTableRow(line)) {
      const tableRows: string[][] = [];
      let hasHeader = false;

      // Collect all table rows
      while (i < lines.length) {
        const currentLine = lines[i];

        if (isTableSeparator(currentLine)) {
          hasHeader = true;
          i++;
          continue;
        }

        if (isTableRow(currentLine)) {
          tableRows.push(parseTableRow(currentLine));
          i++;
          continue;
        }

        // Not a table line, stop
        break;
      }

      if (tableRows.length > 0) {
        const tableContent: Record<string, unknown>[] = [];

        // First row is header if we found a separator
        const headerRow = tableRows[0];
        const bodyRows = hasHeader ? tableRows.slice(1) : [];

        // Header row (or first row if no separator)
        tableContent.push({
          type: 'tableRow',
          content: headerRow.map(cell => ({
            type: hasHeader ? 'tableHeader' : 'tableCell',
            attrs: { colspan: 1, rowspan: 1 },
            content: [{ type: 'paragraph', content: parseInlineMarks(cell) }]
          }))
        });

        // Body rows
        for (const row of bodyRows) {
          // Pad row to match header length if needed
          while (row.length < headerRow.length) {
            row.push('');
          }
          tableContent.push({
            type: 'tableRow',
            content: row.map(cell => ({
              type: 'tableCell',
              attrs: { colspan: 1, rowspan: 1 },
              content: [{ type: 'paragraph', content: parseInlineMarks(cell) }]
            }))
          });
        }

        content.push({ type: 'table', content: tableContent });
      }
      continue;
    }

    // Horizontal rule
    if (line.match(/^(-{3,}|_{3,}|\*{3,})$/)) {
      content.push({ type: 'horizontalRule' });
      i++;
      continue;
    }

    // Regular paragraph
    content.push({
      type: 'paragraph',
      content: parseInlineMarks(line)
    });
    i++;
  }

  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph' }]
  };
}

// Parse inline markdown marks (bold, italic, code, links, strikethrough)
function parseInlineMarks(text: string): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];

  // Process text character by character to handle nested/overlapping marks
  // Patterns: **bold**, *italic*, `code`, [text](url), ~~strikethrough~~
  const pattern = /(\*\*(.+?)\*\*|__(.+?)__|~~(.+?)~~|\*(.+?)\*|_([^_]+)_|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      result.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }

    if (match[2]) {
      // Bold **text**
      result.push({ type: 'text', text: match[2], marks: [{ type: 'bold' }] });
    } else if (match[3]) {
      // Bold __text__
      result.push({ type: 'text', text: match[3], marks: [{ type: 'bold' }] });
    } else if (match[4]) {
      // Strikethrough ~~text~~
      result.push({ type: 'text', text: match[4], marks: [{ type: 'strike' }] });
    } else if (match[5]) {
      // Italic *text*
      result.push({ type: 'text', text: match[5], marks: [{ type: 'italic' }] });
    } else if (match[6]) {
      // Italic _text_
      result.push({ type: 'text', text: match[6], marks: [{ type: 'italic' }] });
    } else if (match[7]) {
      // Inline code `text`
      result.push({ type: 'text', text: match[7], marks: [{ type: 'code' }] });
    } else if (match[8] && match[9]) {
      // Link [text](url)
      result.push({
        type: 'text',
        text: match[8],
        marks: [{ type: 'link', attrs: { href: match[9], target: '_blank' } }]
      });
    }

    lastIndex = pattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result.push({ type: 'text', text: text.slice(lastIndex) });
  }

  // Handle empty text case
  if (result.length === 0) {
    if (text.trim()) {
      return [{ type: 'text', text }];
    }
    return [];
  }

  return result;
}

// Legacy: Convert plain text to TipTap (kept for compatibility)
function textToTipTap(text: string): Record<string, unknown> {
  return markdownToTipTap(text);
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

// Format notification for display
function formatNotification(n: Notification): string {
  let output = `**${n.title}**`;
  if (n.message) output += `\n${n.message}`;
  output += `\n\nStatus: ${n.status}`;
  output += `\nCreated: ${n.created_at}`;
  if (n.snoozed_until) output += `\nSnoozed until: ${n.snoozed_until}`;
  if (n.link_url) output += `\nLink: ${n.link_text || n.link_url}`;
  if (n.page_id) output += `\nRelated page: ${n.page_id}`;
  return output;
}

// Create server
const server = new Server(
  {
    name: "scrivenry-mcp-server",
    version: "1.4.0",
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
      // Page tools
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
              text: `Found ${result.pages.length} pages:\n\n${pageList}${result.has_more ? "\n\n(More pages available)" : ""}`,
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
        if (args.content) {
          body.content = markdownToTipTap(String(args.content));
        }

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
        if (args.cover) body.cover = args.cover;
        if (args.content) {
          body.content = textToTipTap(String(args.content));
        }

        if (Object.keys(body).length === 0) {
          throw new Error("At least one of title, icon, cover, or content must be provided");
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
        if (args.workspace_id) params.set("workspace_id", String(args.workspace_id));
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
              text: `Found ${result.total} results (${result.took_ms}ms):\n\n${resultList}`,
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

      case "scrivenry_move_page": {
        if (!args?.page_id) {
          throw new Error("page_id is required");
        }

        const body: Record<string, unknown> = {
          parent_id: args.parent_id || null,
        };

        const result = await apiRequest<PageResponse>(
          `/pages/${args.page_id}`,
          "PATCH",
          body
        );

        const destination = result.page.parent_id ? `under parent ${result.page.parent_id}` : "to root level";
        return {
          content: [
            {
              type: "text",
              text: `Moved page "${result.page.title}" ${destination}`,
            },
          ],
        };
      }

      // Notification tools
      case "scrivenry_list_notifications": {
        const params = new URLSearchParams();
        if (args?.status) params.set("status", String(args.status));
        if (args?.limit) params.set("limit", String(args.limit));

        const queryString = params.toString();
        const endpoint = `/notifications${queryString ? `?${queryString}` : ""}`;
        const result = await apiRequest<ListNotificationsResponse>(endpoint);

        if (result.notifications.length === 0) {
          return {
            content: [{ type: "text", text: `No notifications found. Unread count: ${result.unread_count}` }],
          };
        }

        const notifList = result.notifications.map(n =>
          `- [${n.status.toUpperCase()}] ${n.title} (ID: ${n.id})\n  ${n.message || "(no message)"}\n  Created: ${n.created_at}`
        ).join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `Found ${result.notifications.length} notifications (${result.unread_count} unread):\n\n${notifList}${result.has_more ? "\n\n(More notifications available)" : ""}`,
            },
          ],
        };
      }

      case "scrivenry_get_notification": {
        if (!args?.notification_id) {
          throw new Error("notification_id is required");
        }

        const result = await apiRequest<NotificationResponse>(
          `/notifications/${args.notification_id}`
        );

        const n = result.notification;
        return {
          content: [
            {
              type: "text",
              text: `# Notification: ${n.title}\n\n**ID:** ${n.id}\n**Type:** ${n.type}\n**Status:** ${n.status}\n**Created:** ${n.created_at}\n\n---\n\n${formatNotification(n)}`,
            },
          ],
        };
      }

      case "scrivenry_create_notification": {
        if (!args?.title) {
          throw new Error("title is required");
        }

        const body: Record<string, unknown> = {
          title: args.title,
        };
        if (args.message) body.message = args.message;
        if (args.type) body.type = args.type;
        if (args.image_url) body.image_url = args.image_url;
        if (args.video_url) body.video_url = args.video_url;
        if (args.link_url) body.link_url = args.link_url;
        if (args.link_text) body.link_text = args.link_text;
        if (args.page_id) body.page_id = args.page_id;
        if (args.metadata) body.metadata = args.metadata;

        const result = await apiRequest<NotificationResponse>("/notifications", "POST", body);

        return {
          content: [
            {
              type: "text",
              text: `Created notification "${result.notification.title}" with ID: ${result.notification.id}`,
            },
          ],
        };
      }

      case "scrivenry_update_notification": {
        if (!args?.notification_id) {
          throw new Error("notification_id is required");
        }
        if (!args?.action) {
          throw new Error("action is required");
        }

        const body: Record<string, unknown> = {
          action: args.action,
        };
        if (args.snoozed_until) body.snoozed_until = args.snoozed_until;

        const result = await apiRequest<NotificationResponse>(
          `/notifications/${args.notification_id}`,
          "PATCH",
          body
        );

        return {
          content: [
            {
              type: "text",
              text: `Updated notification "${result.notification.title}" - Status: ${result.notification.status}`,
            },
          ],
        };
      }

      case "scrivenry_delete_notification": {
        if (!args?.notification_id) {
          throw new Error("notification_id is required");
        }

        await apiRequest<{ success: boolean }>(
          `/notifications/${args.notification_id}`,
          "DELETE"
        );

        return {
          content: [
            {
              type: "text",
              text: `Notification ${args.notification_id} has been permanently deleted.`,
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
  console.error("Scrivenry MCP server v1.1.0 running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
