require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3001;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// Store active SSE connections
const connections = new Map();

// SSE endpoint for real-time progress updates during website generation
app.get('/generate-sse', (req, res) => {
  const clientId = Date.now();
  
  console.log(`SSE connection request received from client ${clientId}`);
  
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  // Send a heartbeat immediately to keep the connection alive
  res.write(': heartbeat\n\n');
  
  // Send a connection established message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`);
  
  // Store the connection
  connections.set(clientId, res);
  
  // Set up a heartbeat to keep the connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (error) {
      console.error(`Error sending heartbeat to client ${clientId}:`, error);
      clearInterval(heartbeat);
      connections.delete(clientId);
    }
  }, 30000); // Send a heartbeat every 30 seconds
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    connections.delete(clientId);
    console.log(`Client ${clientId} disconnected from SSE`);
  });
  
  console.log(`Client ${clientId} connected to SSE - connection active`);
});

// Endpoint to check server status
app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'Brix.AI server is running',
    endpoints: [
      '/generate-sse - Server-Sent Events endpoint',
      '/start-generation - Generate website endpoint',
      '/chat - Chat endpoint',
      '/test - Test endpoint',
      '/color-schemes - Get color schemes',
      '/templates - Get templates'
    ]
  });
});

// Start the website generation process
app.post('/start-generation', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    console.log(`Starting website generation with prompt: "${prompt.substring(0, 30)}..."`);
    
    // Acknowledge the request immediately
    res.status(200).json({ message: 'Generation started' });
    
    // Start the generation process in the background
    generateWebsite(prompt);
  } catch (error) {
    console.error('Error starting generation:', error);
    res.status(500).json({ error: 'Failed to start generation', details: error.message });
  }
});

// Function to generate website with progress updates via SSE
async function generateWebsite(prompt, websiteType = 'business', colorScheme = 'modern', style = 'minimal', brandTone = 'professional') {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const detectedTheme = analyzePromptForTheme(prompt);
    const colors = getThemeColors(prompt);
    
    // Store the original prompt for consistent reference
    const originalPrompt = prompt;

    // Send progress update to all clients
    sendToAllClients({ type: 'step', message: "Starting website generation..." });

    // STEP 1: Generate content structure and raw HTML
    sendToAllClients({ type: 'step', message: "Step 1: Generating content structure and HTML..." });
    
    const contentPrompt = `
Generate a structured HTML website based on this request:
"${originalPrompt}"

Requirements:
1. Create a clean, semantic HTML5 structure for a ${websiteType} website.
2. Include all necessary sections for this type of website.
3. Generate meaningful, contextual content (not lorem ipsum) that matches the request.
4. Include a navigation menu with links to each section.
5. Use proper HTML5 semantic elements (header, footer, section, article, etc).
6. Structure the document properly with appropriate heading hierarchy.
7. Do not include any styling or CSS classes yet.
8. Include meta information and SEO elements.
9. For images, use placeholder elements with descriptive alt text.
10. Include necessary textual content for all sections.
11. Create a clear content hierarchy.
12. Include forms, buttons, and interactive elements as needed.
13. Return ONLY valid HTML, no markdown formatting or explanations.

Return the response as a JSON object with this structure:
{
  "html": "the complete HTML structure without styling",
  "sections": [
    {
      "title": "section name",
      "content": "section content summary",
      "designNotes": "brief notes about what this section should look like"
    }
  ],
  "globalMeta": {
    "title": "site title",
    "description": "site description"
  }
}`;

    const contentResult = await model.generateContent(contentPrompt);
    const contentResponse = await contentResult.response;
    let generatedContent = ensureJsonResponse(contentResponse.text());
    
    // Ensure we only have clean HTML in the generatedContent.html field
    if (generatedContent.html) {
      generatedContent.html = cleanHtmlContent(generatedContent.html);
    }
    
    sendToAllClients({ type: 'step', message: "Content structure generated successfully" });

    // STEP 2: Style the HTML with Tailwind CSS
    sendToAllClients({ type: 'step', message: "Step 2: Applying Tailwind CSS styling..." });
    
    const stylingPrompt = `
You are an expert UI/UX designer specializing in Tailwind CSS.

Take this HTML structure and apply Tailwind CSS classes to create a beautiful, modern website that fulfills this exact request:
"${originalPrompt}"

HTML to style:
${JSON.stringify(generatedContent.html)}

Style Requirements:
1. Use Tailwind CSS classes extensively for all styling.
2. Apply a color scheme that matches the ${detectedTheme} theme.
3. Make the design fully responsive using Tailwind's responsive prefixes (sm:, md:, lg:, xl:).
4. Create a modern, clean aesthetic with proper spacing, typography, and visual hierarchy.
5. Apply hover effects and transitions to interactive elements.
6. Use a consistent color palette throughout.
7. Implement a responsive navigation with mobile menu.
8. DO NOT change the HTML structure or content - only add Tailwind classes.
9. Ensure sufficient contrast between text and backgrounds.
10. Optimize readability with appropriate font sizes and line heights.
11. Apply proper padding and margins for visual breathing room.
12. Create distinctive sections with varying background treatments.
13. Return ONLY the complete HTML with Tailwind classes, no comments, explanations, or markdown.

Return ONLY the complete HTML with Tailwind CSS classes added. Do not include any explanation or markdown formatting.`;

    const stylingResult = await model.generateContent(stylingPrompt);
    const stylingResponse = await stylingResult.response;
    const styledHTML = cleanHtmlContent(stylingResponse.text());
    
    sendToAllClients({ type: 'step', message: "Tailwind styling applied successfully" });

    // STEP 3: Enhance with JavaScript animations and interactivity
    sendToAllClients({ type: 'step', message: "Step 3: Adding JavaScript animations and interactivity..." });
    
    const enhancementPrompt = `
You are a front-end developer specializing in creating beautiful, interactive web experiences.

Take this Tailwind-styled HTML and enhance it with JavaScript animations and interactivity to fulfill this exact request:
"${originalPrompt}"

HTML to enhance:
${styledHTML}

Enhancement Requirements:
1. Add modern, subtle animations to improve user experience.
2. Implement scroll-triggered animations using Intersection Observer or GSAP.
3. Add hover effects and transitions for interactive elements.
4. Create a smooth-scrolling navigation system.
5. Implement mobile menu toggle functionality.
6. Add form validation if forms are present.
7. Create subtle parallax effects or background animations if appropriate.
8. Implement any carousels or sliders if mentioned in the design.
9. Include loading animations or transitions between states.
10. Add any typing effects to headings if appropriate.
11. Optimize all animations for performance.
12. DO NOT change the existing Tailwind styling or HTML structure - only add JavaScript and necessary attributes.
13. Return ONLY the complete HTML with added JavaScript, no explanations or markdown.

Return the complete HTML with all JavaScript included. Ensure all animations are tasteful and enhance rather than distract from the content.`;

    const enhancementResult = await model.generateContent(enhancementPrompt);
    const enhancementResponse = await enhancementResult.response;
    const enhancedHTML = cleanHtmlContent(enhancementResponse.text());
    
    sendToAllClients({ type: 'step', message: "JavaScript enhancements added successfully" });

    // Process the final code with required CDN links and configurations
    const processedCode = enhancedHTML
      .replace(/placehold\.co/g, 'picsum.photos')
      .replace(/<head>/, `
        <head>
          <!-- Generated by Brix.AI -->
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  colors: ${JSON.stringify(colors)},
                  animation: {
                    'float': 'float 3s ease-in-out infinite',
                    'slide-up': 'slideUp 0.5s ease-out',
                    'fade-in': 'fadeIn 0.5s ease-out',
                    'scale-in': 'scaleIn 0.5s ease-out'
                  },
                  keyframes: {
                    float: {
                      '0%, 100%': { transform: 'translateY(0)' },
                      '50%': { transform: 'translateY(-20px)' }
                    },
                    slideUp: {
                      '0%': { transform: 'translateY(100px)', opacity: '0' },
                      '100%': { transform: 'translateY(0)', opacity: '1' }
                    },
                    fadeIn: {
                      '0%': { opacity: '0' },
                      '100%': { opacity: '1' }
                    },
                    scaleIn: {
                      '0%': { transform: 'scale(0.9)', opacity: '0' },
                      '100%': { transform: 'scale(1)', opacity: '1' }
                    }
                  }
                }
              }
            }
          </script>
      `);

    sendToAllClients({ type: 'step', message: "Website generation completed successfully" });

    // Send the final code to all connected clients
    sendToAllClients({ 
      type: 'complete', 
      code: processedCode 
    });
  } catch (error) {
    console.error('Error during website generation:', error);
    sendToAllClients({ 
      type: 'error', 
      message: `Error: ${error.message}`
    });
  }
}

// Helper function to send updates to all connected clients
function sendToAllClients(data) {
  console.log(`Sending to ${connections.size} clients: ${data.type}`);
  if (connections.size === 0) {
    console.warn('No active SSE connections to send data to');
  }
  
  connections.forEach((client, clientId) => {
    try {
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error(`Error sending data to client ${clientId}:`, error);
      // Clean up broken connections
      connections.delete(clientId);
    }
  });
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

// Tailwind-specific color schemes
const themeKeywords = {
  elegant: {
    primary: 'text-gray-800 bg-gray-800',
    secondary: 'text-gray-600 bg-gray-600',
    accent: 'text-gold-500 bg-gold-500',
    background: 'bg-white',
    text: 'text-gray-900',
    gradient: 'bg-gradient-to-r from-gray-800 to-gold-500',
    surface: 'bg-gray-50',
    muted: 'text-gray-400'
  },
  coffee: {
    primary: 'text-amber-800 bg-amber-800',
    secondary: 'text-amber-600 bg-amber-600',
    accent: 'text-amber-500 bg-amber-500',
    background: 'bg-amber-50',
    text: 'text-amber-900',
    gradient: 'bg-gradient-to-r from-amber-800 to-amber-600',
    surface: 'bg-amber-100',
    muted: 'text-amber-400'
  },
  dark: {
    primary: 'text-gray-900 bg-gray-900',
    secondary: 'text-gray-800 bg-gray-800',
    accent: 'text-indigo-500 bg-indigo-500',
    background: 'bg-gray-900',
    text: 'text-gray-100',
    gradient: 'bg-gradient-to-r from-gray-900 to-indigo-900',
    surface: 'bg-gray-800',
    muted: 'text-gray-400'
  },
  nature: {
    primary: 'text-green-700 bg-green-700',
    secondary: 'text-green-600 bg-green-600',
    accent: 'text-yellow-500 bg-yellow-500',
    background: 'bg-green-50',
    text: 'text-gray-800',
    gradient: 'bg-gradient-to-r from-green-700 to-green-600',
    surface: 'bg-green-100',
    muted: 'text-green-500'
  },
  tech: {
    primary: 'text-purple-600 bg-purple-600',
    secondary: 'text-purple-500 bg-purple-500',
    accent: 'text-cyan-400 bg-cyan-400',
    background: 'bg-gray-100',
    text: 'text-gray-900',
    gradient: 'bg-gradient-to-r from-purple-600 to-cyan-400',
    surface: 'bg-white',
    muted: 'text-gray-400'
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

module.exports = { getThemeColors, themeKeywords };

// Website templates with Tailwind-specific classes
const websiteTemplates = {
  business: {
    sections: ['hero', 'services', 'about', 'testimonials', 'contact'],
    features: ['animated counters', 'service cards', 'team carousel', 'testimonial slider'],
    animations: ['fade-in', 'slide-up', 'zoom-in'],
    components: ['contact form', 'newsletter signup', 'social proof section'],
    defaultClasses: {
      container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
      button: 'inline-flex items-center px-4 py-2 rounded-md shadow-sm text-white transition-all duration-300',
      section: 'py-12 sm:py-16 lg:py-20',
      heading: 'text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight'
    }
  },
  portfolio: {
    sections: ['intro', 'projects', 'skills', 'experience', 'contact'],
    features: ['project gallery', 'skill progress bars', 'filterable portfolio'],
    animations: ['reveal', 'parallax', 'tilt-effect'],
    components: ['project modal', 'contact form', 'downloadable resume'],
    defaultClasses: {
      container: 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8',
      button: 'inline-flex items-center px-4 py-2 rounded-lg shadow-md transition-all duration-300',
      section: 'py-16 sm:py-20 lg:py-24',
      heading: 'text-4xl sm:text-5xl lg:text-6xl font-bold'
    }
  },
  ecommerce: {
    sections: ['featured', 'products', 'categories', 'about', 'contact'],
    features: ['product cards', 'shopping cart', 'product quick view'],
    animations: ['cart-animation', 'hover-effects', 'smooth-transitions'],
    components: ['search bar', 'filter sidebar', 'size guide'],
    defaultClasses: {
      container: 'max-w-8xl mx-auto px-4 sm:px-6 lg:px-8',
      button: 'inline-flex items-center px-4 py-2 rounded-md shadow-sm transition-all duration-300',
      section: 'py-10 sm:py-12 lg:py-16',
      heading: 'text-2xl sm:text-3xl lg:text-4xl font-bold'
    }
  }
};

const ensureJsonResponse = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }
      
      const sections = text.split('\n\n').filter(Boolean);
      return {
        sections: sections.map(section => {
          const lines = section.split('\n');
          const title = lines[0].replace(/^#+\s*/, '').trim();
          const content = lines.slice(1).join('\n').trim();
          return { title, content };
        })
      };
    } catch (error) {
      throw new Error(`Failed to parse AI response into JSON: ${error.message}`);
    }
  }
};

app.get('/color-schemes', (req, res) => {
  res.json(themeKeywords);
});

app.get('/templates', (req, res) => {
  res.json(websiteTemplates);
});

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Brix.AI Backend is running!',
    version: '2.2.0',
    features: [
      'Tailwind CSS integration',
      'Dynamic content generation',
      'Responsive design patterns',
      'Modern animations',
      'Multiple color schemes',
      'Website templates',
      'SEO optimization',
      'Accessibility features',
      'Performance optimization',
      'Interactive components'
    ]
  });
});

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `You are Brix.AI, a friendly website generator assistant. 
Provide a clear, and helpful response to: "${message}"
Keep responses focused and direct, avoid answering any unrelated questions or questions related to who or how you function in a polite way.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    res.json({ 
      response: response.text(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to process message', 
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Brix.AI Server running at http://localhost:${port}`);
});

// Export functions for testing or external use if needed
module.exports = { getThemeColors, themeKeywords };
