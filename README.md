# Wikipedia MCP Server

A simple MCP (Model Context Protocol) server that provides tools to fetch and explore Wikipedia pages.

## Features

- `random_wikipedia_page`: Fetches a random Wikipedia page with title, summary, and URL
- `wikipedia_page_details`: Gets detailed information about a specific Wikipedia page by title or URL
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

# Call the wikipedia_page_details tool
node -e "console.log(JSON.stringify({jsonrpc: '2.0', method: 'tools/call', params: {name: 'wikipedia_page_details', arguments: {query: 'Albert Einstein'}}, id: '4'}))" | node src/server.js
```

## Available Tools

The server exposes two tools:

### random_wikipedia_page

Gets a random Wikipedia page with basic information.

**Arguments:** None

**Response:** Title, summary, and URL of a random Wikipedia page

Example client usage:
```typescript
const randomPageResult = await client.callTool({
  name: "random_wikipedia_page",
  arguments: {}
});
```

### wikipedia_page_details

Gets detailed information about a specific Wikipedia page.

**Arguments:** 
- `query` (string): Wikipedia page title or full Wikipedia URL

**Response:** Detailed information including title, description, summary, thumbnail, categories, last modified date, and URL

Example client usage:
```typescript
const detailsResult = await client.callTool({
  name: "wikipedia_page_details",
  arguments: {
    query: "Albert Einstein" // Can also use a URL: "https://en.wikipedia.org/wiki/Albert_Einstein"
  }
});
```

## Workflow Example

The tools are designed to work together in a workflow:

1. Use `random_wikipedia_page` to discover an interesting topic
2. Extract the title or URL from the response
3. Use `wikipedia_page_details` to get more detailed information about that page

## Example Client Code

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

// Get a random page
const randomResult = await client.callTool({
  name: "random_wikipedia_page",
  arguments: {}
});

// Extract the title from the result
const text = randomResult.content[0].text;
const titleMatch = text.match(/Title: (.*?)\n/);
const title = titleMatch ? titleMatch[1] : null;

// If we found a title, get more details about it
if (title) {
  const detailsResult = await client.callTool({
    name: "wikipedia_page_details",
    arguments: { query: title }
  });
  
  console.log(detailsResult.content[0].text);
}
```

## Example Response

When calling the `wikipedia_page_details` tool, you'll get a response like:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Title: Albert Einstein\n\nDescription: German-born theoretical physicist\n\nSummary: Albert Einstein was a German-born theoretical physicist who is widely held to be one of the greatest and most influential scientists of all time. He developed the theory of relativity and made significant contributions to the development of quantum mechanics...\n\nThumbnail: https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/434px-Albert_Einstein_Head.jpg\n\nCategories: 1879 births, 1955 deaths, 20th-century American inventors, 20th-century American physicists\n\nLast Modified: 4/16/2023, 2:15:30 PM\n\nURL: https://en.wikipedia.org/wiki/Albert_Einstein"
    }
  ]
}
```

## How it works

The server uses Wikipedia's APIs:
- The REST API for basic page information
- The Action API for additional details like categories and last modified date

Both tools are designed to handle errors gracefully and provide meaningful error messages if a page cannot be found or another issue occurs.