import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

// Function to get random Wikipedia page (same as in server.js)
async function getRandomWikipediaPage() {
  const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
  const data = await response.json();
  return {
    title: data.title,
    summary: data.extract,
    url: data.content_urls.desktop.page
  };
}

// Main test function
async function runTest() {
  console.log('Starting in-memory test...');
  
  // Create a linked pair of transports for the client and server
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  
  // Create the MCP server
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
  
  // Create the MCP client
  const client = new Client({
    name: 'Test Client',
    version: '1.0.0'
  });
  
  try {
    // Connect both the server and client with their respective transports
    const serverPromise = server.connect(serverTransport);
    await client.connect(clientTransport);
    
    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:', tools);
    
    if (tools.tools.length === 0) {
      throw new Error('No tools found on the server');
    }
    
    // Call the random_wikipedia_page tool
    console.log('Calling random_wikipedia_page tool...');
    const result = await client.callTool({
      name: 'random_wikipedia_page',
      arguments: {}
    });
    
    // Display the result
    console.log('Tool result:');
    console.log(result);
    
    // Test passed
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  } finally {
    // Clean up
    await client.close();
    await server.close();
  }
}

// Run the test
runTest();