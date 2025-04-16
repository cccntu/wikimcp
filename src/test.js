import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Define the main function to test the MCP server
async function testServer() {
  console.log('Starting Wikipedia MCP server test...');
  
  // Create a client transport that starts the server process
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['./src/server.js']
  });
  
  // Create the MCP client
  const client = new Client({
    name: 'Wikipedia MCP Test Client',
    version: '1.0.0',
  });
  
  try {
    // Connect the client
    console.log('Connecting to MCP server...');
    await client.connect(transport);
    
    // List available tools
    console.log('Listing available tools...');
    const tools = await client.listTools();
    console.log('Available tools:', tools);
    
    // Call the random_wikipedia_page tool
    console.log('Calling random_wikipedia_page tool...');
    const result = await client.callTool({
      name: 'random_wikipedia_page',
      arguments: {}
    });
    
    // Display the result
    console.log('Tool result:');
    console.log(result);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error testing MCP server:', error);
  } finally {
    // Clean up
    await client.close();
  }
}

// Run the test
testServer().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});