require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios'); // Add axios for API requests
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const app = express();
const port = 3001;

// DeepSeek API configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Replace with Gemini API configuration and function
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent';

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: false
};
app.use(cors(corsOptions));
app.use(express.json());

// Add a middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Load templates and components at startup
const templatesDir = path.join(__dirname, 'templates');
const componentsDir = path.join(__dirname, 'components');

// Maps to store templates and components
const templatesMap = new Map();
const componentsMap = new Map();

// Register Handlebars helpers
Handlebars.registerHelper('times', function(n, block) {
  let accum = '';
  for(let i = 0; i < n; ++i) {
    accum += block.fn(i);
  }
  return accum;
});

// Load all templates
function loadTemplates() {
  try {
    if (!fs.existsSync(templatesDir)) {
      console.error(`Templates directory not found: ${templatesDir}`);
      return;
    }
    
    const files = fs.readdirSync(templatesDir);
    
    files.forEach(file => {
      if (file.endsWith('.html')) {
        const templateName = path.basename(file, '.html');
        const templatePath = path.join(templatesDir, file);
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        
        // Precompile template with Handlebars
        templatesMap.set(templateName, templateContent);
        
        console.log(`Loaded template: ${templateName}`);
      }
    });
    
    console.log(`Loaded ${templatesMap.size} templates`);
  } catch (error) {
    console.error('Error loading templates:', error);
  }
}

// Load all components
function loadComponents() {
  try {
    if (!fs.existsSync(componentsDir)) {
      console.error(`Components directory not found: ${componentsDir}`);
      return;
    }
    
    const files = fs.readdirSync(componentsDir);
    
    files.forEach(file => {
      if (file.endsWith('.html')) {
        const componentName = path.basename(file, '.html');
        const componentPath = path.join(componentsDir, file);
        const componentContent = fs.readFileSync(componentPath, 'utf8');
        
        // Precompile component with Handlebars
        componentsMap.set(componentName, componentContent);
        
        console.log(`Loaded component: ${componentName}`);
      }
    });
    
    console.log(`Loaded ${componentsMap.size} components`);
  } catch (error) {
    console.error('Error loading components:', error);
  }
}

// Load templates and components at startup
loadTemplates();
loadComponents();

// Store active SSE connections
const connections = new Map();

// SSE endpoint for real-time progress updates during website generation
app.get('/generate-sse', (req, res) => {
  console.log('Client connected to SSE');
  
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  // Generate a unique client ID
  const clientId = Date.now().toString();
  connections.set(clientId, res);
  
  // Send the client ID to the client
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);
  
  // Send a welcome message
  res.write(`data: ${JSON.stringify({ type: 'info', message: 'Connected to Brix.AI server. Ready to generate!' })}\n\n`);
  
  // Set up a heartbeat to keep the connection alive
  const heartbeatInterval = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(heartbeatInterval);
      connections.delete(clientId);
      console.log(`Client ${clientId} disconnected (connection ended)`);
      return;
    }
    
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
  }, 15000); // Send heartbeat every 15 seconds
  
  // Handle client disconnection
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    connections.delete(clientId);
    console.log(`Client ${clientId} disconnected`);
  });
});

// Endpoint to check server status
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    endpoints: [
      { path: '/', method: 'GET', description: 'Server status' },
      { path: '/templates', method: 'GET', description: 'List available templates' },
      { path: '/components', method: 'GET', description: 'List available components' },
      { path: '/test', method: 'GET', description: 'Test endpoint' },
      { path: '/generate-sse', method: 'GET', description: 'SSE endpoint for real-time updates' },
      { path: '/start-generation', method: 'POST', description: 'Start website generation' },
      { path: '/chat', method: 'POST', description: 'Chat with the AI about website creation' }
    ],
    version: '1.0.0'
  });
});

// Endpoint to list available templates
app.get('/templates', (req, res) => {
  res.json({
    templates: Array.from(templatesMap.keys())
  });
});

// Endpoint to list available components
app.get('/components', (req, res) => {
  res.json({
    components: Array.from(componentsMap.keys())
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running correctly',
    version: '1.0.0',
    features: ['SSE', 'Website Generation', 'Chat', 'Templates', 'Components'],
    templates_loaded: Array.from(templatesMap.keys()),
    components_loaded: Array.from(componentsMap.keys())
  });
});

// Start the website generation process
app.post('/start-generation', async (req, res) => {
  try {
    // Extract prompt and client ID from request
    const { prompt, clientId } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    if (!clientId || !connections.has(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID, please connect to the SSE endpoint first' });
    }
    
    // Acknowledge the request
    res.status(202).json({ message: 'Generation started', clientId });
    
    // Start the generation process in the background
    generateWebsite(prompt, clientId).catch(error => {
      console.error('Error in background generation:', error);
    });
  } catch (error) {
    console.error('Error starting generation:', error);
    res.status(500).json({ error: 'Failed to start generation' });
  }
});

// Helper function to ensure a valid JSON response from AI
function ensureJsonResponse(text) {
  try {
    // First try straightforward JSON parse
    return JSON.parse(text);
  } catch (e) {
    try {
      // Try to extract JSON from markdown code block
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }
      
      // Try to find anything that looks like a JSON object
      const potentialJson = text.match(/(\{[\s\S]*\})/);
      if (potentialJson) {
        return JSON.parse(potentialJson[1]);
      }
      
      // If we still can't parse JSON, create a minimal structure
      console.error("Failed to parse AI response as JSON:", e);
      console.log("Original text:", text);
      
      // Fallback minimal JSON structure
      return {
        selected_template: "landing_v1",
        meta: {
          title: "Generated Website",
          description: "A website created with Brix.AI"
        },
        content_structure: {
          header: {
            component: "header_nav",
            content: {
              company_name: "Brix.AI",
              navigation_links: [
                { text: "Home", url: "#home" },
                { text: "Features", url: "#features" },
                { text: "Contact", url: "#contact" }
              ]
            }
          },
          sections: [
            {
              id: "hero",
              suggested_component: "hero_centered",
              generated_content: {
                heading: "Welcome to our Website",
                subheading: "We create amazing digital experiences",
                primary_button: {
                  text: "Get Started",
                  url: "#contact"
                }
              }
            }
          ],
          footer: {
            component: "footer_standard",
            content: {
              company_name: "Brix.AI",
              company_description: "AI-powered website generation",
              current_year: new Date().getFullYear()
            }
          }
        },
        theme_configuration: {
          colors: {
            primary: "#3B82F6",
            secondary: "#10B981",
            accent: "#8B5CF6"
          }
        }
      };
    } catch (innerError) {
      console.error("Failed to recover from JSON parsing error:", innerError);
      throw new Error("Failed to parse AI response into JSON");
    }
  }
}

// Helper function to call DeepSeek API
async function callDeepSeekAPI(prompt, temperature = 0.7, max_tokens = 2048) {
  try {
    console.log("Calling DeepSeek API with prompt length:", prompt.length);
    
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: "deepseek-reasoner",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: temperature,
        max_tokens: max_tokens,
        top_p: 1.0,
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );
    
    // Extract the assistant's message content
    const content = response.data.choices[0].message.content;
    console.log("Received response from DeepSeek API with length:", content.length);
    return content;
  } catch (error) {
    console.error('DeepSeek API Error:', error.response?.data || error.message);
    // Provide detailed error information
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    }
    throw new Error(`DeepSeek API error: ${error.message}`);
  }
}

// Helper function to call Gemini API
async function callGeminiAPI(prompt, temperature = 0.7, maxOutputTokens = 2048) {
  try {
    console.log("Calling Gemini API with prompt length:", prompt.length);
    
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxOutputTokens,
          topP: 1.0
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract the content from Gemini's response format
    const content = response.data.candidates[0].content.parts[0].text;
    console.log("Received response from Gemini API with length:", content.length);
    return content;
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    // Provide detailed error information
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    }
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

// Tailwind-specific color schemes
const themeKeywords = {
  elegant: {
    primary: '#6366f1', // Indigo
    secondary: '#8b5cf6', // Purple
    accent: '#ec4899', // Pink
    background: '#ffffff',
    text: '#1f2937'
  },
  coffee: {
    primary: '#92400e', // Amber/Brown
    secondary: '#b45309', // Amber dark
    accent: '#f59e0b', // Amber light
    background: '#f5f5f4',
    text: '#44403c'
  },
  dark: {
    primary: '#3b82f6', // Blue
    secondary: '#0ea5e9', // Sky
    accent: '#8b5cf6', // Purple
    background: '#0f172a',
    text: '#e2e8f0'
  },
  nature: {
    primary: '#10b981', // Emerald
    secondary: '#059669', // Green
    accent: '#f59e0b', // Amber
    background: '#f0fdf4',
    text: '#1f2937'
  },
  tech: {
    primary: '#8b5cf6', // Purple
    secondary: '#7c3aed', // Violet
    accent: '#06b6d4', // Cyan
    background: '#f8fafc',
    text: '#0f172a'
  }
};

function analyzePromptForTheme(prompt) {
  const promptLower = prompt.toLowerCase();
  
  // Check for explicit color mentions
  if (promptLower.includes('dark theme') || promptLower.includes('dark mode')) {
    return 'dark';
  }
  
  // Check for business/website type contexts
  if (promptLower.includes('coffee') || promptLower.includes('cafe') || promptLower.includes('restaurant')) {
    return 'coffee';
  }
  
  if (promptLower.includes('tech') || promptLower.includes('software') || promptLower.includes('digital')) {
    return 'tech';
  }
  
  if (promptLower.includes('nature') || promptLower.includes('eco') || promptLower.includes('organic')) {
    return 'nature';
  }
  
  if (promptLower.includes('luxury') || promptLower.includes('elegant') || promptLower.includes('professional')) {
    return 'elegant';
  }
  
  // Default to elegant theme if no specific context is found
  return 'elegant';
}

function getThemeColors(prompt) {
  const theme = analyzePromptForTheme(prompt);
  return themeKeywords[theme];
}

// Export functions for testing or external use if needed
module.exports = { getThemeColors, themeKeywords };

// Function to generate website with progress updates via SSE
async function generateWebsite(prompt, clientId) {
  try {
    sendToAllClients({ type: 'progress', message: 'Starting generation...', percentage: 5 }, clientId);
    
    // Automatically detect theme colors from prompt
    const themeColors = getThemeColors(prompt);
    
    // Construct the AI prompt
    const aiPrompt = `
You are a professional web developer tasked with generating a JSON structure for a fully functional website based on this user request: "${prompt}"

Create a detailed website plan in JSON format with the following structure:
{
  "selected_template": "landing_v1", // Choose from available templates: landing_v1, business_v1, portfolio_v1
  "meta": {
    "title": "Website Title",
    "description": "SEO description of the website"
  },
  "content_structure": {
    "header": {
      "component": "header_nav", // Use header_nav component
      "content": {
        "company_name": "Company Name",
        "navigation_links": [
          { "text": "Home", "url": "#home" },
          { "text": "Features", "url": "#features" },
          // Additional links as needed
        ]
      }
    },
    "sections": [
      {
        "id": "hero", // Unique identifier for the section
        "suggested_component": "hero_centered", // Choose from: hero_centered, features_grid, testimonials_slider, contact_form, pricing_table, etc.
        "generated_content": {
          // Content specific to the component, for example for hero_centered:
          "heading": "Main Headline",
          "subheading": "Supporting text that explains the value proposition",
          "primary_button": {
            "text": "Get Started",
            "url": "#contact"
          },
          "secondary_button": {
            "text": "Learn More",
            "url": "#features"
          }
          // Additional fields depending on component
        }
      }
      // At least 3 sections are required, each with unique content
    ],
    "footer": {
      "component": "footer_standard", // Use footer_standard component
      "content": {
        "company_name": "Company Name",
        "company_description": "Brief description",
        "social_links": [
          { "platform": "twitter", "url": "https://twitter.com/" },
          { "platform": "facebook", "url": "https://facebook.com/" }
          // Additional social links
        ],
        "current_year": 2023
      }
    }
  },
  "theme_configuration": {
    "colors": {
      "primary": "${themeColors.primary}",
      "secondary": "${themeColors.secondary}",
      "accent": "${themeColors.accent}"
    },
    "fonts": {
      "primary": "Inter",
      "heading": "Inter"
    }
  },
  "javascript_suggestions": [
    {
      "description": "Add smooth scrolling for navigation links",
      "selector": "a[href^='#']",
      "event": "click",
      "action": "e.preventDefault(); document.querySelector(this.getAttribute('href')).scrollIntoView({behavior: 'smooth'});"
    }
    // Additional JavaScript suggestions
  ],
  "image_keywords": ["relevant", "image", "keywords", "for", "the", "website"]
}

Ensure your response contains ONLY valid JSON with no other text before or after. Make the content appropriate and professional for the website purpose. Generate at least 3 sections for a complete website.
`;

    // Send prompt to the AI API
    sendToAllClients({ type: 'progress', message: 'Generating website plan...', percentage: 15 }, clientId);
    const aiResponse = await callGeminiAPI(aiPrompt, 0.7, 4000);
    
    // Parse the response
    let websitePlan;
    try {
      websitePlan = ensureJsonResponse(aiResponse);
      sendToAllClients({ type: 'progress', message: 'Website plan generated successfully', percentage: 40 }, clientId);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      sendToAllClients({ type: 'error', message: 'Failed to parse AI response. Retrying...' }, clientId);
      
      // Retry once with a more structured prompt
      const retryPrompt = `
Create a JSON structure for a website based on this request: "${prompt}"

IMPORTANT: Your response must be ONLY valid JSON with this exact structure:
{
  "selected_template": "landing_v1",
  "meta": { "title": "", "description": "" },
  "content_structure": {
    "header": { "component": "header_nav", "content": { "company_name": "", "navigation_links": [] } },
    "sections": [
      {
        "id": "hero",
        "suggested_component": "hero_centered",
        "generated_content": { "heading": "", "subheading": "", "primary_button": { "text": "", "url": "" } }
      },
      {
        "id": "features",
        "suggested_component": "features_grid",
        "generated_content": { "heading": "", "subheading": "", "features": [] }
      },
      {
        "id": "contact",
        "suggested_component": "contact_form",
        "generated_content": { "heading": "", "subheading": "" }
      }
    ],
    "footer": { "component": "footer_standard", "content": { "company_name": "", "company_description": "" } }
  },
  "theme_configuration": { "colors": { "primary": "#3B82F6", "secondary": "#10B981", "accent": "#8B5CF6" } }
}

No text before or after the JSON. Make sure all braces match and all quotes are properly escaped.
`;
      const retryResponse = await callGeminiAPI(retryPrompt, 0.5, 4000);
      websitePlan = ensureJsonResponse(retryResponse);
    }
    
    // Verify the plan is valid
    if (!websitePlan.content_structure || !websitePlan.content_structure.sections || 
        websitePlan.content_structure.sections.length < 1) {
      throw new Error('Generated website plan is missing required sections');
    }
    
    // Assemble the website from the plan
    sendToAllClients({ type: 'progress', message: 'Assembling website from generated plan...', percentage: 50 }, clientId);
    const finalHtml = await assembleWebsiteFromPlan(websitePlan, clientId);
    
    // Send the final HTML
    sendToAllClients({ type: 'complete', message: 'Website generated successfully!', percentage: 100, html: finalHtml }, clientId);
    
    return finalHtml;
  } catch (error) {
    console.error('Error in generateWebsite:', error);
    sendToAllClients({ type: 'error', message: `Website generation failed: ${error.message}` }, clientId);
    throw error;
  }
}

async function assembleWebsiteFromPlan(plan, clientId) {
  try {
    // Send update to client
    sendToAllClients({ type: 'progress', message: 'Starting website assembly...', percentage: 10 }, clientId);
    
    // Extract key information from the plan
    const { selected_template, meta, content_structure, theme_configuration, javascript_suggestions = [] } = plan;
    
    // Verify we have the selected template
    if (!templatesMap.has(selected_template)) {
      throw new Error(`Template "${selected_template}" not found. Available templates: ${Array.from(templatesMap.keys()).join(', ')}`);
    }
    
    // Get the base template
    const templateSource = templatesMap.get(selected_template);
    const template = Handlebars.compile(templateSource);
    
    // Process header
    sendToAllClients({ type: 'progress', message: 'Assembling header...', percentage: 20 }, clientId);
    let headerHtml = '';
    if (content_structure.header && content_structure.header.component) {
      const headerComponent = componentsMap.get(content_structure.header.component);
      if (headerComponent) {
        const headerTemplate = Handlebars.compile(headerComponent);
        headerHtml = headerTemplate(content_structure.header.content || {});
      } else {
        console.warn(`Header component "${content_structure.header.component}" not found.`);
      }
    }
    
    // Process sections
    sendToAllClients({ type: 'progress', message: 'Assembling content sections...', percentage: 40 }, clientId);
    const sectionsHtml = [];
    if (Array.isArray(content_structure.sections)) {
      for (const section of content_structure.sections) {
        if (section.suggested_component && componentsMap.has(section.suggested_component)) {
          const sectionComponent = componentsMap.get(section.suggested_component);
          const sectionTemplate = Handlebars.compile(sectionComponent);
          const sectionHtml = sectionTemplate(section.generated_content || {});
          sectionsHtml.push(sectionHtml);
        } else {
          // Fallback for missing components - generate a simple section
          const fallbackHtml = `
            <section id="${section.id || 'section'}" class="py-12 px-4">
              <div class="container mx-auto">
                <h2 class="text-3xl font-bold mb-6">${section.generated_content?.heading || 'Section Title'}</h2>
                <p class="text-lg mb-6">${section.generated_content?.content || 'Section content goes here'}</p>
              </div>
            </section>
          `;
          sectionsHtml.push(fallbackHtml);
        }
      }
    }
    
    // Process footer
    sendToAllClients({ type: 'progress', message: 'Assembling footer...', percentage: 60 }, clientId);
    let footerHtml = '';
    if (content_structure.footer && content_structure.footer.component) {
      const footerComponent = componentsMap.get(content_structure.footer.component);
      if (footerComponent) {
        const footerTemplate = Handlebars.compile(footerComponent);
        footerHtml = footerTemplate(content_structure.footer.content || {});
      } else {
        console.warn(`Footer component "${content_structure.footer.component}" not found.`);
      }
    }
    
    // Apply theme and finalize
    sendToAllClients({ type: 'progress', message: 'Applying theme and finalizing...', percentage: 80 }, clientId);
    const finalHtml = applyThemeAndFinalize(template, {
      title: meta.title || 'Generated Website',
      description: meta.description || 'A website created with Brix.AI',
      header: headerHtml,
      content: sectionsHtml.join('\n'),
      footer: footerHtml,
      theme: theme_configuration,
      javascript: javascript_suggestions
    });
    
    sendToAllClients({ type: 'progress', message: 'Website assembly complete!', percentage: 95 }, clientId);
    
    // Return the final HTML
    return finalHtml;
  } catch (error) {
    console.error('Error assembling website:', error);
    sendToAllClients({ type: 'error', message: `Error assembling website: ${error.message}` }, clientId);
    throw error;
  }
}

function applyThemeAndFinalize(template, data) {
  // Generate Tailwind CSS configuration script
  const tailwindConfig = `
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '${data.theme?.colors?.primary || '#3B82F6'}',
              secondary: '${data.theme?.colors?.secondary || '#10B981'}',
              accent: '${data.theme?.colors?.accent || '#8B5CF6'}'
            },
            fontFamily: {
              sans: ['${data.theme?.fonts?.primary || 'Inter'}, 'sans-serif'],
              heading: ['${data.theme?.fonts?.heading || 'Inter'}, 'sans-serif']
            }
          }
        }
      }
    </script>
  `;
  
  // Generate JavaScript for interactivity
  let jsScript = '';
  if (Array.isArray(data.javascript) && data.javascript.length > 0) {
    jsScript = `
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          // JavaScript suggestions from AI
          ${data.javascript.map(suggestion => {
            // Convert the suggestion into actual JavaScript
            if (suggestion.event && suggestion.selector && suggestion.action) {
              return `
                // ${suggestion.description || 'Interactive element'}
                document.querySelectorAll('${suggestion.selector}').forEach(function(element) {
                  element.addEventListener('${suggestion.event}', function(e) {
                    ${suggestion.action}
                  });
                });
              `;
            }
            return '// ' + (suggestion.description || 'Skipped suggestion due to missing information');
          }).join('\n')}
        });
      </script>
    `;
  }
  
  // Apply all the data to the template
  return template({
    ...data,
    tailwindConfig,
    jsScript
  });
}

// Chat endpoint using Gemini API
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Function to generate a chat response
    const generateChatResponse = async (retryCount = 0) => {
      try {
        // Simplified prompt for the chatbot
        const chatPrompt = `
You are Brix.AI, a friendly and professional assistant that specializes in website creation.
The user is asking: "${message}"

Provide a helpful, clear, and concise response that addresses their question about website development, design, or the Brix.AI platform.
If they ask about website creation, you can explain that you can generate complete websites from simple text prompts.
If they ask about templates or components, you can mention that you support various templates like landing pages, business sites, and portfolios.

Keep your response concise but friendly and helpful.
`;
        
        // Call the Gemini API
        const response = await callGeminiAPI(chatPrompt, 0.7, 1024);
        return response.trim();
      } catch (error) {
        console.error(`Chat generation attempt ${retryCount + 1} failed:`, error);
        
        // Retry once more if not already retried
        if (retryCount < 1) {
          console.log('Retrying chat generation...');
          return generateChatResponse(retryCount + 1);
        }
        
        // If all retries fail, return a fallback response
        return getFallbackResponse(message);
      }
    };
    
    // Generate response
    const response = await generateChatResponse();
    
    // Send the response
    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Failed to generate chat response', fallback: getFallbackResponse(message) });
  }
});

// Fallback responses for when the AI fails
function getFallbackResponse(message) {
  const messageLower = message.toLowerCase();
  
  // Check for keywords to provide relevant fallback responses
  if (messageLower.includes('template') || messageLower.includes('templates')) {
    return "I offer several website templates including landing pages, business sites, and portfolios. Each template can be customized with your content and branding. What kind of website are you looking to create?";
  }
  
  if (messageLower.includes('component') || messageLower.includes('components')) {
    return "Our system includes various components like headers, hero sections, feature grids, testimonial sliders, and contact forms that can be assembled into a complete website. Is there a specific component you're interested in?";
  }
  
  if (messageLower.includes('how') && (messageLower.includes('create') || messageLower.includes('make') || messageLower.includes('generate'))) {
    return "To create a website with Brix.AI, simply describe what you want in the prompt field and click 'Generate'. For example, you could write 'Create a professional business website for a marketing agency with a modern design, testimonials section, and contact form.'";
  }
  
  // Default fallback response
  return "I'm here to help you create websites with Brix.AI. You can generate complete, customized websites by describing what you want in the prompt field. Is there something specific you'd like to know about website creation or our features?";
}

// Helper function to send updates to all connected clients
function sendToAllClients(data, clientId) {
  console.log(`Sending to ${connections.size} clients: ${data.type}`);
  if (connections.size === 0) {
    console.warn('No active SSE connections to send data to');
  }
  
  const client = connections.get(clientId);
  if (client) {
    try {
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error(`Error sending data to client ${clientId}:`, error);
      // Clean up broken connections
      connections.delete(clientId);
    }
  }
}

// Helper function to clean HTML content from AI responses
function cleanHtmlContent(content) {
  // Remove markdown code blocks
  let cleanedContent = content.replace(/```html\n?|\n?```/g, '').trim();
  
  // Remove any comments or explanations before or after the HTML
  cleanedContent = cleanedContent.replace(/^\s*(?:Here's|The complete HTML|I've enhanced|This HTML|This is the|Here is the)[^<]*</i, '<');
  
  // Remove any trailing explanations after the HTML
  cleanedContent = cleanedContent.replace(/<\/html>\s*[\s\S]*/i, '</html>');
  
  // Remove any lines that start with non-HTML characters (likely explanations)
  const lines = cleanedContent.split('\n');
  const htmlLines = lines.filter(line => {
    const trimmedLine = line.trim();
    return trimmedLine === '' || 
           trimmedLine.startsWith('<') || 
           trimmedLine.startsWith('//') || 
           trimmedLine.startsWith('/*') || 
           trimmedLine.includes('*/') ||
           trimmedLine.startsWith('}') ||
           (trimmedLine.includes('=') && trimmedLine.includes(';'));
  });
  
  return htmlLines.join('\n');
}

// Start server
app.listen(port, () => {
  console.log(`Brix.AI Server running at http://localhost:${port}`);
  console.log(`Available templates: ${Array.from(templatesMap.keys()).join(', ')}`);
  console.log(`Available components: ${Array.from(componentsMap.keys()).join(', ')}`);
});