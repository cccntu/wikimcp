// Script to test different Wikipedia APIs for getting more detailed content
// Using global fetch, which is available in recent Node.js versions

// Test subject
const pageName = 'Albert Einstein';

async function testWikipediaAPIs() {
  console.log(`Testing Wikipedia APIs for page: ${pageName}\n`);

  // 1. Test the REST API summary endpoint (what we're currently using)
  console.log('1. TESTING REST API SUMMARY ENDPOINT');
  try {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageName)}`;
    const summaryResponse = await fetch(summaryUrl);
    const summaryData = await summaryResponse.json();
    
    console.log('Summary length:', summaryData.extract.length, 'characters');
    console.log('Summary type:', summaryData.type);
    console.log('First 200 characters:', summaryData.extract.substring(0, 200) + '...');
    console.log('Available fields:', Object.keys(summaryData));
  } catch (error) {
    console.error('Error testing REST API summary:', error);
  }
  
  // 2. Test the REST API mobile-sections endpoint (might have more content)
  console.log('\n2. TESTING REST API MOBILE-SECTIONS ENDPOINT');
  try {
    const mobileSectionsUrl = `https://en.wikipedia.org/api/rest_v1/page/mobile-sections/${encodeURIComponent(pageName)}`;
    const mobileSectionsResponse = await fetch(mobileSectionsUrl);
    const mobileSectionsData = await mobileSectionsResponse.json();
    
    console.log('Lead section text length:', mobileSectionsData.lead.sections[0].text?.length || 'No text available');
    console.log('Number of sections:', mobileSectionsData.remaining.sections.length);
    console.log('First few sections:', mobileSectionsData.remaining.sections.slice(0, 3).map(s => s.line));
    
    // Check the lead section text (intro paragraph)
    if (mobileSectionsData.lead.sections[0].text) {
      console.log('First 200 characters of lead text:', mobileSectionsData.lead.sections[0].text.substring(0, 200) + '...');
    }
  } catch (error) {
    console.error('Error testing REST API mobile-sections:', error);
  }
  
  // 3. Test the REST API mobile-sections-lead endpoint (intro section only)
  console.log('\n3. TESTING REST API MOBILE-SECTIONS-LEAD ENDPOINT');
  try {
    const mobileLeadUrl = `https://en.wikipedia.org/api/rest_v1/page/mobile-sections-lead/${encodeURIComponent(pageName)}`;
    const mobileLeadResponse = await fetch(mobileLeadUrl);
    const mobileLeadData = await mobileLeadResponse.json();
    
    if (mobileLeadData.sections && mobileLeadData.sections[0] && mobileLeadData.sections[0].text) {
      console.log('Lead text length:', mobileLeadData.sections[0].text.length, 'characters');
      console.log('First 200 characters:', mobileLeadData.sections[0].text.substring(0, 200) + '...');
    } else {
      console.log('No lead text available in the response');
    }
  } catch (error) {
    console.error('Error testing REST API mobile-sections-lead:', error);
  }
  
  // 4. Test the Action API with extracts (potentially longer content)
  console.log('\n4. TESTING ACTION API WITH EXTRACTS');
  try {
    // Try different extract lengths
    const extractLengths = [1, 2, 3, 4, 5];
    
    for (const extractLength of extractLengths) {
      const actionApiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&exsectionformat=plain&exchars=${extractLength * 500}&titles=${encodeURIComponent(pageName)}&format=json&origin=*`;
      const actionApiResponse = await fetch(actionApiUrl);
      const actionApiData = await actionApiResponse.json();
      
      const pageId = Object.keys(actionApiData.query.pages)[0];
      const extract = actionApiData.query.pages[pageId].extract;
      
      console.log(`\nExtract with ${extractLength * 500} characters:`);
      console.log('Actual length:', extract.length);
      console.log('First 200 characters:', extract.substring(0, 200) + '...');
      console.log('Last 100 characters:', extract.substring(extract.length - 100));
    }
  } catch (error) {
    console.error('Error testing Action API with extracts:', error);
  }
  
  // 5. Test getting plain text content of the first section using parse API
  console.log('\n5. TESTING ACTION API WITH PARSE FOR FIRST SECTION');
  try {
    const parseApiUrl = `https://en.wikipedia.org/w/api.php?action=parse&prop=text&section=0&page=${encodeURIComponent(pageName)}&format=json&origin=*`;
    const parseApiResponse = await fetch(parseApiUrl);
    const parseApiData = await parseApiResponse.json();
    
    // The text will be HTML, but we can extract a rough character count
    console.log('HTML content length of first section:', parseApiData.parse.text['*'].length);
  } catch (error) {
    console.error('Error testing Action API with parse:', error);
  }
}

// Run the tests
testWikipediaAPIs().catch(console.error);