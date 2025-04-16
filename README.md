# Wikipedia MCP Server

A simple MCP (Model Context Protocol) server that provides a tool to fetch random Wikipedia pages.

## Features

- `random_wikipedia_page` tool that fetches a random Wikipedia page with title, summary, and URL
- Zero dependencies beyond the MCP SDK
- Easy to use with npx directly from GitHub

## Installation & Usage

### Run directly with npx from GitHub (no installation needed)

```bash
npx github:cccntu/wikimcp
```

### Local Development

```bash
git clone https://github.com/cccntu/wikimcp.git
cd wikimcp
npm install
npm start
```

### Global Installation

```bash
npm install -g github:cccntu/wikimcp
wikimcp
```

This will start the MCP server using stdio as the transport mechanism.

## Testing the Server

We provide several ways to test the server:

### Automated Tests

Run the included test scripts:

```bash
# Process-based test (launches server in separate process)
npm test

# In-memory test (faster, server and client in same process)
npm run test:inmemory
```

### Manual Testing with Raw MCP Protocol

You can test the server manually by sending raw MCP protocol messages:

```bash
# Initialize the connection
node -e "console.log(JSON.stringify({jsonrpc: '2.0', method: 'initialize', params: {capabilities: {}, protocolVersion: '2025-03-26', clientInfo: {name: 'test', version: '1.0.0'}}, id: '1'}))" | node src/server.js

# List available tools
node -e "console.log(JSON.stringify({jsonrpc: '2.0', method: 'tools/list', params: {}, id: '2'}))" | node src/server.js

# Call the random_wikipedia_page tool
node -e "console.log(JSON.stringify({jsonrpc: '2.0', method: 'tools/call', params: {name: 'random_wikipedia_page', arguments: {}}, id: '3'}))" | node src/server.js
```

## Using with MCP clients

The server exposes a single tool:

- `random_wikipedia_page`: Takes no arguments and returns a randomly selected Wikipedia page with its title, summary, and URL.

Example client usage:

```typescript
// Create client and connect to the server
const transport = new StdioClientTransport({
  command: 'npx',
  args: ['github:cccntu/wikimcp']
});
const client = new Client({
  name: 'example-client',
  version: '1.0.0'
});
await client.connect(transport);

// Call the tool
const result = await client.callTool({
  name: "random_wikipedia_page",
  arguments: {}
});

console.log(result.content[0].text);
```

## How it works

The server uses Wikipedia's REST API to fetch a random article summary. It doesn't require any additional dependencies as it uses the built-in fetch API.

## Example Response

When calling the `random_wikipedia_page` tool, you'll get a response like:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Title: Paddy Ashdown\n\nSummary: Jeremy John Durham Ashdown, Baron Ashdown of Norton-sub-Hamdon, better known as Paddy Ashdown, was a British politician and diplomat who served as Leader of the Liberal Democrats from 1988 to 1999. Internationally, he is recognised for his role as High Representative for Bosnia and Herzegovina from 2002 to 2006, following his vigorous lobbying for military action against Yugoslavia in the 1990s.\n\nURL: https://en.wikipedia.org/wiki/Paddy_Ashdown"
    }
  ]
}
```

## Example usage with Claude Code or other MCP-compatible clients

1. Start the server in one terminal:
   ```bash
   npx github:cccntu/wikimcp
   ```

2. Connect to it with an MCP client in another terminal or application.

3. Call the `random_wikipedia_page` tool to get a random Wikipedia article.

The tool will return a random Wikipedia article with its title, summary, and URL.