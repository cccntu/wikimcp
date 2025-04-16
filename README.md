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

Gets content from a specific Wikipedia page with configurable length.

**Arguments:** 
- `query` (string): Wikipedia page title or full Wikipedia URL
- `max_length` (number, optional): Maximum length of content in characters (default: 2000, max: 10000)

**Response:** Clean, focused content with just the title, article text, and URL

Example client usage:
```typescript
// Default length (2000 characters)
const basicResult = await client.callTool({
  name: "wikipedia_page_details",
  arguments: {
    query: "Albert Einstein" // Can also use a URL: "https://en.wikipedia.org/wiki/Albert_Einstein"
  }
});

// Custom length (5000 characters - will get more content beyond intro)
const longResult = await client.callTool({
  name: "wikipedia_page_details",
  arguments: {
    query: "Albert Einstein",
    max_length: 5000
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
      "text": "Title: Albert Einstein\n\nAlbert Einstein (14 March 1879 – 18 April 1955) was a German-born theoretical physicist who is best known for developing the theory of relativity. Einstein also made important contributions to quantum mechanics, a revolution in physics begun at the start of the 20th century. His mass–energy equivalence formula E = mc2, which arises from relativity theory, has been dubbed \"the world's most famous equation\". His work is also known for its influence on the philosophy of science. He received the 1921 Nobel Prize in Physics \"for his services to theoretical physics, and especially for his discovery of the law of the photoelectric effect\", a pivotal step in the development of quantum theory. His intellectual achievements and originality resulted in \"Einstein\" becoming synonymous with \"genius\".\n\nURL: https://en.wikipedia.org/wiki/Albert_Einstein"
    }
  ]
}
```

## How it works

The server uses Wikipedia's APIs:
- The REST API for basic page information (title, URL)
- The Action API with the `extracts` parameter for article content
- Smart content handling that automatically adjusts to user-specified max_length:
  - For shorter content (≤1500 chars): Returns just the introduction
  - For longer content (>1500 chars): Includes content beyond the introduction

Both tools are designed to handle errors gracefully and provide meaningful error messages if a page cannot be found or another issue occurs.

### Technical Details

The `max_length` parameter allows users to control how much content they receive:
- Values from 500-10000 characters are supported (values outside this range are clamped)
- Default is 2000 characters
- Setting to higher values (e.g., 5000+) provides more comprehensive information
- Content is cleanly formatted with just title, article text, and URL