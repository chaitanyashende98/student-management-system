require("dotenv").config();
const express = require("express");
const { randomUUID } = require("node:crypto");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { z } = require("zod");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
const API_URL = process.env.STUDENT_API_URL;
const API_KEY = process.env.MCP_API_KEY;

if (!API_URL || !API_KEY) {
  throw new Error("Set STUDENT_API_URL and MCP_API_KEY first.");
}

function createServer() {
  const server = new McpServer({
    name: "student-management-mcp",
    version: "1.0.0"
  });

  server.registerTool(
    "list_students",
    {
      description: "List student records from the Student Management System.",
      inputSchema: {}
    },
    async () => {
      try {
        const response = await fetch(`${API_URL}/api/students`, {
          headers: { Accept: "application/json" }
        });

        if (!response.ok) throw new Error("Student API error");

        const result = await response.json();
        const students = (result.data || result.students || result)
          .slice(0, 50)
          .map(s => ({
            studentId: s.studentId,
            name: s.name,
            department: s.department,
            semester: s.semester
          }));

        return {
          content: [{ type: "text", text: JSON.stringify(students) }]
        };
      } catch {
        return {
          isError: true,
          content: [{ type: "text", text: "Could not retrieve student records." }]
        };
      }
    }
  );

  server.registerTool(
    "search_students",
    {
      description: "Search for students using a name or student ID.",
      inputSchema: {
        query: z.string().min(1).max(100)
      }
    },
    async ({ query }) => {
      try {
        const url = `${API_URL}/api/students?q=${encodeURIComponent(query)}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error("Student API error");

        const result = await response.json();
        const records = (result.data || result.students || result).slice(0, 50);

        return {
          content: [{
            type: "text",
            text: JSON.stringify(records.map(s => ({
              studentId: s.studentId,
              name: s.name,
              department: s.department,
              semester: s.semester
            })))
          }]
        };
      } catch {
        return {
          isError: true,
          content: [{ type: "text", text: "Could not search student records." }]
        };
      }
    }
  );

  return server;
}

app.get("/health", (_req, res) => {
  res.json({ success: true, service: "student-management-mcp" });
});

app.post("/mcp", async (req, res) => {
  const auth = req.get("authorization") || "";
  const supplied = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (
    supplied.length !== API_KEY.length ||
    !require("node:crypto").timingSafeEqual(
      Buffer.from(supplied),
      Buffer.from(API_KEY)
    )
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request failed:", error.message);
    if (!res.headersSent) res.status(500).json({ error: "MCP request failed" });
  } finally {
    await transport.close().catch(() => {});
    await server.close().catch(() => {});
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MCP server listening on port ${PORT}`);
});
