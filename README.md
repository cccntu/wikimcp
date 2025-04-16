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

## Using with MCP clients

The server exposes a single tool:

- `random_wikipedia_page`: Takes no arguments and returns a randomly selected Wikipedia page with its title, summary, and URL.

Example client usage:

```typescript
const result = await client.callTool({
  name: "random_wikipedia_page",
  arguments: {}
});
```

## How it works

The server uses Wikipedia's REST API to fetch a random article summary. It doesn't require any additional dependencies as it uses the built-in fetch API.

## Example usage with Claude Code or other MCP-compatible clients

1. Start the server in one terminal:
   ```bash
   npx github:cccntu/wikimcp
   ```

2. Connect to it with an MCP client in another terminal or application.

3. Call the `random_wikipedia_page` tool to get a random Wikipedia article.

The tool will return a random Wikipedia article with its title, summary, and URL.