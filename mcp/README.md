# Open Sunsama MCP Server

An MCP (Model Context Protocol) server that enables AI agents like Claude, Cursor, and other AI assistants to manage your tasks, time blocks, and calendar through the Open Sunsama API.

## Features

- **Task Management**: Create, update, complete, delete, and schedule tasks
- **Time Blocking**: Schedule focused work sessions on your calendar
- **Subtasks**: Break down tasks into smaller actionable items
- **User Profile**: Access and update user preferences
- **Full CRUD Operations**: Complete API coverage for AI-assisted productivity

## Prerequisites

1. An Open Sunsama account (cloud: [opensunsama.com](https://opensunsama.com) or self-hosted)
2. An API key from your Open Sunsama account
3. Node.js 18+ or Bun runtime

## Installation

### From Source (Development)

```bash
# Clone the repository
git clone https://github.com/your-org/open-sunsama.git
cd open-sunsama/mcp

# Install dependencies
bun install

# Build
bun run build
```

### Getting an API Key

1. Open the Open Sunsama web app
2. Go to **Settings** → **API Keys**
3. Click **"Generate New Key"**
4. Select scopes:
   - `tasks:read` and `tasks:write` for task management
   - `time-blocks:read` and `time-blocks:write` for calendar
   - `user:read` and `user:write` for profile access
5. Copy the key (it's only shown once!)

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENSUNSAMA_API_KEY` | Yes | - | Your API key starting with `os_` |
| `OPENSUNSAMA_API_URL` | No | `https://api.opensunsama.com` | API server URL |

### Self-Hosted / Local Development

If you're running the API locally or self-hosting, set `OPENSUNSAMA_API_URL` to your API URL:

```json
{
  "env": {
    "OPENSUNSAMA_API_KEY": "os_your-api-key",
    "OPENSUNSAMA_API_URL": "http://localhost:3001"
  }
}
```

**Note:** If you're using the official cloud version at [opensunsama.com](https://opensunsama.com), you can omit `OPENSUNSAMA_API_URL` (defaults to `https://api.opensunsama.com`).

## Usage with AI Assistants

### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "open-sunsama": {
      "command": "node",
      "args": ["/path/to/open-sunsama/mcp/build/index.js"],
      "env": {
        "OPENSUNSAMA_API_KEY": "os_your-api-key-here"
      }
    }
  }
}
```

> **Self-hosted/Local**: Add `"OPENSUNSAMA_API_URL": "http://localhost:3001"` to the env object

### Cursor

Create `.cursor/mcp.json` in your project root or configure in **Cursor Settings → MCP**:

```json
{
  "mcpServers": {
    "open-sunsama": {
      "command": "node",
      "args": ["/path/to/open-sunsama/mcp/build/index.js"],
      "env": {
        "OPENSUNSAMA_API_KEY": "os_your-api-key-here"
      }
    }
  }
}
```

> **Self-hosted/Local**: Add `"OPENSUNSAMA_API_URL": "http://localhost:3001"` to the env object

### VS Code with Continue Extension

Add to `~/.continue/config.json`:

```json
{
  "mcpServers": [
    {
      "name": "open-sunsama",
      "command": "node",
      "args": ["/path/to/open-sunsama/mcp/build/index.js"],
      "env": {
        "OPENSUNSAMA_API_KEY": "os_your-api-key-here"
      }
    }
  ]
}
```

### Windsurf / Cline / Other MCP-Compatible Tools

Most tools use a similar configuration format:

```json
{
  "mcpServers": {
    "open-sunsama": {
      "command": "node",
      "args": ["/path/to/open-sunsama/mcp/build/index.js"],
      "env": {
        "OPENSUNSAMA_API_KEY": "os_your-api-key-here"
      }
    }
  }
}
```

### Running with Bun

If you prefer Bun over Node.js:

```json
{
  "mcpServers": {
    "open-sunsama": {
      "command": "bun",
      "args": ["run", "/path/to/open-sunsama/mcp/build/index.js"],
      "env": {
        "OPENSUNSAMA_API_KEY": "os_your-api-key-here"
      }
    }
  }
}
```

## Available Tools

### Task Management

| Tool | Description |
|------|-------------|
| `list_tasks` | List tasks with filters (date, range, completion status, backlog) |
| `get_task` | Get detailed information about a specific task |
| `create_task` | Create a new task with title, notes, priority, schedule |
| `update_task` | Update task fields (title, notes, priority, schedule) |
| `complete_task` | Mark a task as complete |
| `uncomplete_task` | Reopen a completed task |
| `delete_task` | Permanently delete a task |
| `schedule_task` | Move a task to a specific date or backlog |
| `reorder_tasks` | Reorder tasks within a date |

### Subtask Management

| Tool | Description |
|------|-------------|
| `list_subtasks` | List all subtasks for a task |
| `create_subtask` | Add a subtask to a task |
| `toggle_subtask` | Toggle subtask completion |
| `update_subtask` | Update subtask title/position |
| `delete_subtask` | Delete a subtask |

### Time Block Management

| Tool | Description |
|------|-------------|
| `list_time_blocks` | List time blocks with filters |
| `get_time_block` | Get details of a time block |
| `create_time_block` | Schedule a new time block |
| `update_time_block` | Update time block details |
| `delete_time_block` | Remove a time block |
| `link_task_to_time_block` | Link/unlink a task to a time block |
| `get_schedule_for_day` | Get formatted daily schedule |

### User Profile

| Tool | Description |
|------|-------------|
| `get_user_profile` | Get current user's profile |
| `update_user_profile` | Update name, timezone, preferences |

## Example Interactions

Once configured, you can ask your AI assistant things like:

### Task Management
- "What tasks do I have scheduled for today?"
- "Create a task to review the quarterly report with high priority"
- "Mark my 'Send emails' task as complete"
- "Move the 'Research competitors' task to next Monday"
- "Show me all my backlog tasks"

### Time Blocking
- "Block 2 hours tomorrow morning for deep work starting at 9 AM"
- "What does my schedule look like for Friday?"
- "Link my 'Write documentation' task to my 2 PM time block"
- "Delete the meeting block I created for today"

### Subtasks
- "Add subtasks to my 'Prepare presentation' task: create slides, add charts, practice delivery"
- "Check off the 'create slides' subtask"
- "What subtasks are left on my project task?"

### Planning
- "Help me plan my day - I need to do code review, write docs, and have a team meeting"
- "Schedule my tasks for this week based on priority"

## Testing

Run the test suite to verify your setup:

```bash
# Set your API key
export OPENSUNSAMA_API_KEY=os_your-api-key-here

# Run all tests
bun run test

# Or run individual test suites
bun run test:tasks
bun run test:time-blocks
bun run test:subtasks
```

### Using MCP Inspector

For interactive testing and debugging:

```bash
export OPENSUNSAMA_API_KEY=os_your-api-key-here
bun run inspector
```

This opens a web UI where you can test each tool manually.

## Troubleshooting

### "OPENSUNSAMA_API_KEY environment variable is required"

Make sure you've set the API key in your MCP configuration:

```json
{
  "env": {
    "OPENSUNSAMA_API_KEY": "os_your-actual-key"
  }
}
```

### "Network request failed" or Connection Errors

1. Verify the API is reachable: `curl https://api.opensunsama.com/health`
2. If self-hosted/local, check `OPENSUNSAMA_API_URL` is correct
3. Ensure your API key has the required scopes

### Tools Not Appearing in AI Assistant

1. Restart your AI assistant after changing the configuration
2. Check the configuration file path is correct
3. Verify the path to `build/index.js` is absolute

### "Authentication required" or 401 Errors

1. Verify your API key is valid and not expired
2. Check that your key has the required scopes for the operation
3. Generate a new API key if needed

## Development

### Project Structure

```
mcp/
├── src/
│   ├── index.ts          # Main entry point
│   ├── lib/
│   │   └── api-client.ts # HTTP client for Open Sunsama API
│   └── tools/
│       ├── tasks.ts      # Task management tools
│       ├── time-blocks.ts# Time block tools
│       ├── subtasks.ts   # Subtask tools
│       └── user.ts       # User profile tools
├── tests/
│   └── test-all.ts       # Comprehensive test suite
├── build/                # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Building

```bash
bun run build    # Compile TypeScript
bun run dev      # Watch mode for development
```

### Adding New Tools

1. Create or edit a file in `src/tools/`
2. Use the `server.tool()` pattern with Zod schemas for validation
3. Register your tools in `src/index.ts`
4. Rebuild and test

## API Key Scopes

| Scope | Permissions |
|-------|-------------|
| `tasks:read` | List and view tasks |
| `tasks:write` | Create, update, delete tasks |
| `time-blocks:read` | List and view time blocks |
| `time-blocks:write` | Create, update, delete time blocks |
| `user:read` | View user profile |
| `user:write` | Update user profile |

## License

This MCP server is part of the Open Sunsama project and follows the same license terms. See the main repository LICENSE file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/your-org/open-sunsama/issues)
- **Documentation**: [Open Sunsama Docs](https://github.com/your-org/open-sunsama)
