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
      query: z.string().describe('Wikipedia page title or full Wikipedia URL'),
      max_length: z.number().optional().describe('Maximum length of content in characters (default: 2000, max: 10000)')
    },
    async ({ query, max_length = 2000 }) => {
      try {
        // Validate max_length (ensure it's within reasonable limits)
        const validatedMaxLength = Math.min(Math.max(500, max_length), 10000);
        
        const page = await getWikipediaPageDetails(query, validatedMaxLength);
        
        let responseText = `Title: ${page.title}\n\n`;
        responseText += `${page.extract}\n\n`;
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
async function getWikipediaPageDetails(query, maxLength = 2000) {
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
  
  // Get basic info using the REST API for metadata (title and URL)
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const summaryResponse = await fetch(summaryUrl);
  
  if (!summaryResponse.ok) {
    throw new Error(`Wikipedia page not found: ${title}`);
  }
  
  const summaryData = await summaryResponse.json();
  
  // Get a longer extract with the user-specified length
  // If maxLength is high enough, we get content beyond intro by setting exintro=0
  const useFullArticle = maxLength > 1500;
  
  const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=${useFullArticle ? '0' : '1'}&explaintext=1&exsectionformat=plain&exchars=${maxLength}&titles=${encodeURIComponent(title)}&format=json&origin=*`;
  const extractResponse = await fetch(extractUrl);
  const extractData = await extractResponse.json();
  const extractPageId = Object.keys(extractData.query.pages)[0];
  const detailedExtract = extractData.query.pages[extractPageId].extract;
  
  // Return only the essential data (title, content, and URL)
  return {
    title: summaryData.title,
    extract: detailedExtract,
    content_urls: summaryData.content_urls
  };
}

// Start the server
main().catch(error => {
  // Write to stderr instead of stdout to avoid interfering with MCP protocol
  console.error('Error starting server:', error);
  process.exit(1);
});