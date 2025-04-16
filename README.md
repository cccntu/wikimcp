# Wikipedia MCP Server

A simple MCP (Model Context Protocol) server that provides a tool to fetch random Wikipedia pages.

## Features

- `random_wikipedia_page` tool that fetches a random Wikipedia page with title, summary, and URL
- Zero dependencies beyond the MCP SDK
- Easy to use with npx

## Installation

### Local Development

```bash
git clone https://github.com/YOUR_USERNAME/wikimcp.git
cd wikimcp
npm install
```

### Global Installation

```bash
npm install -g wikimcp
```

### No Installation (using npx)

```bash
npx wikimcp
```

## Usage

### Local Development

```bash
npm start
```

### After Global Installation

```bash
wikimcp
```

### Using npx (no installation)

```bash
npx wikimcp
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

## Publishing

To publish to npm:

```bash
npm login
npm publish
```

After publishing, users can run it directly with:

```bash
npx wikimcp
```