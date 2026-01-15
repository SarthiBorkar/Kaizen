# Cursor MCP Configuration

This directory contains MCP (Model Context Protocol) server configurations for Cursor IDE.

## Setup Instructions

### 1. Copy Configuration to Cursor Config Directory

**For macOS/Linux:**
```bash
mkdir -p ~/.cursor
cp .cursor/mcp.json ~/.cursor/mcp.json
```

**For Windows:**
```powershell
mkdir $env:APPDATA\.cursor
copy .cursor\mcp.json $env:APPDATA\.cursor\mcp.json
```

### 2. Configure API Keys

Edit `~/.cursor/mcp.json` and replace the placeholder values:

- `GITHUB_PERSONAL_ACCESS_TOKEN` - Get from https://github.com/settings/tokens
- `BRAVE_API_KEY` - Get from https://brave.com/search/api/

### 3. MCP Servers Included

1. **filesystem** - Access to your project files
2. **github** - GitHub repository integration
3. **brave-search** - Web search capabilities
4. **docker** - Docker container management (requires Docker Desktop)
5. **postgres** - PostgreSQL database access (optional)
6. **puppeteer** - Browser automation
7. **sequential-thinking** - Enhanced reasoning
8. **memory** - Persistent memory across sessions

### 4. Docker MCP Setup

The Docker MCP server requires Docker Desktop to be running. It provides:
- Container management
- Image operations
- Network inspection
- Volume management

**To use Docker MCP:**
```bash
# Make sure Docker is running
docker ps

# The MCP server will connect to /var/run/docker.sock
```

### 5. Optional: Claude API Configuration

Add to your Cursor settings (Cmd/Ctrl + ,):

```json
{
  "cursor.anthropic.apiKey": "your_claude_api_key_here"
}
```

Get your Claude API key from: https://console.anthropic.com/

### 6. Restart Cursor

After setting up the configuration, restart Cursor IDE for changes to take effect.

## Testing MCP Servers

In Cursor, you can test if MCP servers are working by asking:
- "List files in this project" (filesystem)
- "Show me my Docker containers" (docker)
- "Search the web for..." (brave-search)

## Troubleshooting

### MCP Server Not Loading
- Check Cursor logs: `Cmd/Ctrl + Shift + P` → "Developer: Toggle Developer Tools"
- Ensure npx is installed: `npx --version`
- For Docker: Ensure Docker Desktop is running

### Permission Issues
- Make sure the MCP config file has proper permissions:
  ```bash
  chmod 644 ~/.cursor/mcp.json
  ```

### Docker Socket Access
If Docker MCP fails, check socket permissions:
```bash
ls -la /var/run/docker.sock
```

## Project-Specific Configuration

This configuration is set up for the Kaizen accountability bot project with:
- File system access to: `/Users/sarthiborkar/Build/TG/Kaizen`
- PostgreSQL can be configured for Turso database access (optional)

## Additional MCP Servers

You can add more MCP servers from:
- https://github.com/modelcontextprotocol/servers
- Custom MCP servers you build

Example:
```json
{
  "mcpServers": {
    "your-custom-server": {
      "command": "node",
      "args": ["path/to/your/server.js"]
    }
  }
}
```
