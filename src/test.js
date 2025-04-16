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
    console.log('\nTesting random_wikipedia_page tool...');
    const randomResult = await client.callTool({
      name: 'random_wikipedia_page',
      arguments: {}
    });
    
    // Display the result
    console.log('Random page result:');
    console.log(randomResult);
    
    // Extract the title from the result
    const text = randomResult.content[0].text;
    const titleMatch = text.match(/Title: (.*?)\n/);
    const title = titleMatch ? titleMatch[1] : 'Albert Einstein'; // Fallback to Einstein if we can't extract
    
    // Call the wikipedia_page_details tool with the title from the random page
    console.log(`\nTesting wikipedia_page_details tool with query: "${title}"...`);
    const detailsResult = await client.callTool({
      name: 'wikipedia_page_details',
      arguments: { query: title }
    });
    
    // Display the result
    console.log('Page details result:');
    console.log(detailsResult);
    
    // Test calling wikipedia_page_details with a fixed known page
    console.log('\nTesting wikipedia_page_details tool with known page: "Albert Einstein"...');
    const einsteinResult = await client.callTool({
      name: 'wikipedia_page_details',
      arguments: { query: 'Albert Einstein' }
    });
    
    console.log('Albert Einstein page details:');
    console.log(einsteinResult);
    
    console.log('\nAll tests completed successfully!');
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