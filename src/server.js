import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Main function to start server
async function main() {
  // Create an MCP server
  const server = new McpServer({
    name: 'Wikipedia MCP',
    version: '1.0.0'
  });

  // Add random_wikipedia_page tool
  server.tool(
    'random_wikipedia_page',
    'Get a random Wikipedia page with title and summary',
    {},
    async () => {
      try {
        const page = await getRandomWikipediaPage();
        return {
          content: [{
            type: 'text',
            text: `Title: ${page.title}\n\nSummary: ${page.summary}\n\nURL: ${page.url}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error fetching random Wikipedia page: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.log('Wikipedia MCP server started');
}

// Function to get random Wikipedia page
async function getRandomWikipediaPage() {
  const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
  const data = await response.json();
  return {
    title: data.title,
    summary: data.extract,
    url: data.content_urls.desktop.page
  };
}

// Start the server
main().catch(error => {
  console.error('Error starting server:', error);
  process.exit(1);
});