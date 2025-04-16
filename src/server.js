import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

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

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
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
  
  // First get basic info using the REST API for metadata
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const summaryResponse = await fetch(summaryUrl);
  
  if (!summaryResponse.ok) {
    throw new Error(`Wikipedia page not found: ${title}`);
  }
  
  const summaryData = await summaryResponse.json();
  
  // Get categories and last modified date
  const categoriesUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=categories|info&titles=${encodeURIComponent(title)}&format=json&origin=*`;
  const categoriesResponse = await fetch(categoriesUrl);
  const categoriesData = await categoriesResponse.json();
  
  // Extract page ID (we don't know it in advance)
  const pageId = Object.keys(categoriesData.query.pages)[0];
  const pageDetails = categoriesData.query.pages[pageId];
  
  // Get a longer extract (around 1000 characters, which is more detailed but not too long)
  const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&exsectionformat=plain&exchars=1000&titles=${encodeURIComponent(title)}&format=json&origin=*`;
  const extractResponse = await fetch(extractUrl);
  const extractData = await extractResponse.json();
  const extractPageId = Object.keys(extractData.query.pages)[0];
  const detailedExtract = extractData.query.pages[extractPageId].extract;
  
  // Combine the data
  return {
    ...summaryData,
    extract: detailedExtract, // Replace the short summary with the more detailed one
    categories: pageDetails.categories || [],
    lastModified: pageDetails.touched
  };
}

// Start the server
main().catch(error => {
  // Write to stderr instead of stdout to avoid interfering with MCP protocol
  console.error('Error starting server:', error);
  process.exit(1);
});