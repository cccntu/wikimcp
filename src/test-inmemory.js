import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { z } from 'zod';

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

// Function to get detailed information about a specific Wikipedia page
async function getWikipediaPageDetails(query) {
  // Handle both titles and URLs
  let title;
  
  if (query.startsWith('http')) {
    // Extract title from URL
    const url = new URL(query);
    const pathParts = url.pathname.split('/');
    title = pathParts[pathParts.length - 1];
    title = decodeURIComponent(title);
  } else {
    // Use query as title
    title = query;
  }
  
  // First get basic info using the REST API
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const summaryResponse = await fetch(summaryUrl);
  
  if (!summaryResponse.ok) {
    throw new Error(`Wikipedia page not found: ${title}`);
  }
  
  const summaryData = await summaryResponse.json();
  
  // Then get more detailed info using the action API
  const detailsUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=categories|info&titles=${encodeURIComponent(title)}&format=json&origin=*`;
  const detailsResponse = await fetch(detailsUrl);
  const detailsData = await detailsResponse.json();
  
  // Extract page ID (we don't know it in advance)
  const pageId = Object.keys(detailsData.query.pages)[0];
  const pageDetails = detailsData.query.pages[pageId];
  
  // Combine the data
  return {
    ...summaryData,
    categories: pageDetails.categories || [],
    lastModified: pageDetails.touched
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
  
  // Add wikipedia_page_details tool
  server.tool(
    'wikipedia_page_details',
    'Get detailed information about a specific Wikipedia page by title or URL',
    {
      query: z.string().describe('Wikipedia page title or full Wikipedia URL')
    },
    async ({ query }) => {
      try {
        const page = await getWikipediaPageDetails(query);
        
        let responseText = `Title: ${page.title}\n\n`;
        
        if (page.description) {
          responseText += `Description: ${page.description}\n\n`;
        }
        
        responseText += `Summary: ${page.extract}\n\n`;
        
        if (page.thumbnail) {
          responseText += `Thumbnail: ${page.thumbnail.source}\n\n`;
        }
        
        responseText += `Categories: ${page.categories ? page.categories.map(c => c.title.replace('Category:', '')).join(', ') : 'None'}\n\n`;
        responseText += `Last Modified: ${page.lastModified ? new Date(page.lastModified).toLocaleString() : 'Unknown'}\n\n`;
        responseText += `URL: ${page.content_urls.desktop.page}`;
        
        return {
          content: [{
            type: 'text',
            text: responseText
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error fetching Wikipedia page details: ${error.message}`
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
    
    // Test passed
    console.log('\nTest completed successfully!');
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