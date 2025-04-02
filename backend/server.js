require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const { markdownToJson } = require(path.resolve(__dirname, '../utils/markdownToJson'));
const { generateTemplate } = require('./websiteTemplate');

const app = express();
// Parse PORT as URL if it contains a protocol, otherwise use as is or default to 3001
let port = process.env.PORT || 3001;
if (typeof port === 'string' && port.includes('://')) {
  try {
    // Extract just the port number from the URL format
    const url = new URL(port);
    port = url.port || 3001;
  } catch (e) {
    console.error('Failed to parse PORT as URL, using default 3001', e);
    port = 3001;
  }
}

// Check if API key is configured properly
if (!process.env.GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY is not set in the .env file');
}

// Initialize the API with proper configuration - removing trim() to handle undefined case
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Add retry mechanism for API requests
const withRetry = async (fn, maxAttempts = 3) => {
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxAttempts}`);
      return await fn();
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      lastError = error;
      if (attempt < maxAttempts) {
        // Wait before retrying (optional exponential backoff)
        const delay = Math.min(1000 * 2 ** (attempt - 1), 5000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error(`All ${maxAttempts} attempts failed.`);
  throw lastError;
};

// Update CORS to be more permissive during development
const corsOptions = {
  origin: '*', // Allow all origins during development
  methods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

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
    console.log('Trying to parse direct JSON response');
    return JSON.parse(text);
  } catch (e) {
    console.log('Direct JSON parsing failed, trying to extract JSON from markdown', e.message);
    try {
      // Log the first part of the text to help with debugging
      console.log('Text starts with:', text.substring(0, 100).replace(/\n/g, '\\n'));
      
      // Try multiple regex patterns to extract JSON from markdown code blocks
      let jsonContent = null;
      
      // Pattern 1: Standard markdown JSON code block
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        console.log('Found JSON in standard markdown code block');
        jsonContent = jsonMatch[1].trim();
      }
      
      // Pattern 2: Code block without language specifier
      if (!jsonContent) {
        const codeBlockMatch = text.match(/```\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          console.log('Found potential JSON in generic code block');
          jsonContent = codeBlockMatch[1].trim();
        }
      }
      
      // Pattern 3: Look for JSON-like structure without code blocks
      if (!jsonContent) {
        const jsonObjectMatch = text.match(/(\{[\s\S]*\})/);
        if (jsonObjectMatch) {
          console.log('Found JSON-like structure in text');
          jsonContent = jsonObjectMatch[1].trim();
        }
      }
      
      // Try to parse the extracted content if we found any
      if (jsonContent) {
        try {
          return JSON.parse(jsonContent);
        } catch (jsonError) {
          console.log('Extracted content is not valid JSON:', jsonError.message);
          console.log('Extracted content sample:', jsonContent.substring(0, 100));
          
          // Try cleaning up the content before parsing
          const cleanedJson = jsonContent
            .replace(/\\"/g, '"')         // Fix escaped quotes
            .replace(/"\s*\n\s*"/g, '","') // Fix broken line separators
            .replace(/,\s*}/g, '}')       // Remove trailing commas
            .replace(/,\s*]/g, ']');      // Remove trailing commas in arrays
            
          console.log('Cleaned JSON sample:', cleanedJson.substring(0, 100));
          
          try {
            return JSON.parse(cleanedJson);
          } catch (cleanedError) {
            console.log('Cleaned content is still not valid JSON:', cleanedError.message);
          }
        }
      }
      
      // Handle formatted markdown content if all JSON extraction attempts failed
      console.log('No valid JSON found, trying to structure as sections');
      const cleanedText = text.replace(/\r\n/g, '\n'); // Normalize line endings
      
      // Try to convert markdown to structured JSON using the utility
      try {
        const structuredContent = markdownToJson(cleanedText);
        if (structuredContent && structuredContent.content && structuredContent.content.length > 0) {
          console.log('Successfully converted markdown to structured JSON using markdownToJson utility');
          return {
            sections: structuredContent.content.map(item => {
              if (item.type === 'section') {
                return {
                  title: item.title || 'Section',
                  content: item.content ? processContentArray(item.content) : ''
                };
              } else if (item.type === 'paragraph') {
                return {
                  title: 'Content',
                  content: processMarkdownContent(item.text || '')
                };
              }
              return { title: 'Section', content: '' };
            })
          };
        }
      } catch (markdownError) {
        console.log('Error converting with markdownToJson utility:', markdownError.message);
        // Continue with fallback approach
      }
      
      // Final fallback - create a simple structure from sections
      const sections = cleanedText.split('\n\n').filter(Boolean);
      
      // Process markdown sections
      return {
        sections: sections.map(section => {
          const lines = section.split('\n');
          const titleMatch = lines[0].match(/^#+\s*(.*)/);
          const title = titleMatch ? titleMatch[1].trim() : lines[0].trim();
          const content = processMarkdownContent(lines.slice(titleMatch ? 1 : 0).join('\n').trim());
          return { title, content };
        }),
        globalMeta: {
          title: "Generated Website",
          description: "Website generated by Brix.AI"
        }
      };
    } catch (error) {
      console.error('All parsing attempts failed:', error);
      console.log('Raw text from AI (first 500 chars):', text.substring(0, 500) + '...');
      
      // Return a minimal valid structure rather than throwing
      return {
        sections: [
          {
            title: "Generated Content",
            content: text.replace(/```/g, '').replace(/json/g, ''),
            design: {
              layout: "flex"
            }
          }
        ],
        globalMeta: {
          title: "Generated Website",
          description: "Website created with Brix.AI"
        }
      };
    }
  }
};

// Helper function to process content array
function processContentArray(contentArray) {
  if (!contentArray || !Array.isArray(contentArray)) return '';
  
  return contentArray.map(item => {
    if (item.type === 'paragraph') {
      return processMarkdownContent(item.text || '');
    } else if (item.type === 'subsection') {
      return `<h3>${item.title || ''}</h3>${processContentArray(item.content || [])}`;
    }
    return '';
  }).join('\n\n');
}

// Helper function to process markdown content
function processMarkdownContent(content) {
  if (!content) return '';
  
  // Handle lists
  content = content.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
  content = content.replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>');
  
  // Handle bold - fix regex patterns
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  content = content.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Handle italic - fix regex patterns
  content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
  content = content.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Handle headers (h3 and below, as h1-h2 are likely already used for section titles)
  content = content.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  content = content.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>');
  content = content.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>');
  
  // Handle links
  content = content.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>');
  
  // Handle code blocks - fix regex
  content = content.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded"><code>$1</code></pre>');
  
  // Handle inline code - fix regex
  content = content.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');
  
  // Handle paragraphs - fix template literals
  const paragraphs = content.split('\n\n');
  content = paragraphs.map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.match(/^<(ul|li|h|pre|code)/)) return p;
    return `<p>${p}</p>`;
  }).join('\n\n');
  
  return content;
}

// Store active SSE connections
const connections = new Map();

// Function to generate website with progress updates via SSE
async function generateWebsite(prompt, res, websiteType = 'business', colorScheme = 'modern', style = 'minimal', brandTone = 'professional') {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    // Use the getThemeColors and analyzePromptForTheme functions that are already defined
    const detectedTheme = analyzePromptForTheme(prompt);
    const colors = getThemeColors(prompt);
    
    // Store the original prompt for consistent reference
    const originalPrompt = prompt;

    // Send progress update to all clients
    sendToAllClients({ type: 'step', message: "Starting website generation..." });

    // Updated content prompt with explicit instruction on color scheme
    const contentPrompt = `
Generate a minimalistic, Neumorphism website for a ${websiteType} using Tailwind CSS with the following details:
"${prompt}"

Requirements:
1. Use a visually engaging style with ${detectedTheme}-themed designs and icons.
2. Tone of voice: ${brandTone}.
3. Use the ${detectedTheme} theme colors throughout the design. Ensure that the color scheme (including background, text, and accent colors) directly reflects a ${detectedTheme} style.
4. Include all necessary sections for a ${websiteType} website.
5. Generate real, contextual content (not lorem ipsum).
6. Focus on clear call-to-actions and user engagement.
7. Consider responsive design and a mobile-first approach.
8. Include meta descriptions and title tags.
9. Suggest image descriptions and placements.
10. Create a form for the contact section.
11. Specify interactive elements and animations.
12. Ensure the design is minimalistic with smooth animations and transitions.
13. Implement dynamic animations using JavaScript and make sure they work for:
    - Scroll-triggered animations.
    - Hover effects with transitions.
    - Interactive elements like carousels and modals.
14. Use modern layout patterns:
    - Grid-based masonry layouts.
    - Asymmetric hero sections.
    - Floating elements with parallax.
15. Ensure that any links are implemented as internal anchor links that redirect smoothly to the respective sections on the same page.
16. For the hero section, if possible, generate typing effects to display the main headline dynamically and provide the javascript for it.
17. Ensure performance optimizations such as lazy loading, optimized images with blur placeholders, and code splitting suggestions.

I need the response to be in clean, parseable JSON format with this structure:
{
  "sections": [
    {
      "title": "section name",
      "content": "section content",
      "design": {
        "layout": "grid|flex|cols-[1-12]",
        "spacing": "tight|normal|loose",
        "images": [
          {
            "description": "image description",
            "alt": "alt text",
            "size": "sm|md|lg"
          }
        ],
        "animations": {
          "entry": "fade|slide|zoom",
          "scroll": "reveal|parallel",
          "hover": "scale|glow",
          "typing": "enabled"
        },
        "interactions": {
          "buttons": "hover:scale|hover:glow",
          "cards": "hover:lift|hover:shadow"
        }
      },
      "meta": {
        "description": "SEO description",
        "keywords": ["keyword1", "keyword2"]
      }
    }
  ],
  "globalMeta": {
    "title": "site title",
    "description": "site description"
  }
}

IMPORTANT: Return ONLY pure JSON with no markdown formatting, no code blocks (\`\`\`) and no explanation text. Just the raw JSON object. The response must be directly parseable with JSON.parse().
`;

    console.log('Sending content prompt to Gemini API...');
    const contentResult = await withRetry(() => model.generateContent(contentPrompt));
      
    const contentResponse = await contentResult.response;
    console.log('Received content response, length:', contentResponse.text().length);
    
    // Log the first part of the response to help debugging
    const responseText = contentResponse.text();
    console.log('Response starts with:', responseText.substring(0, 100).replace(/\n/g, '\\n'));
    
    let generatedContent;
    try {
      generatedContent = ensureJsonResponse(responseText);
      console.log('Successfully parsed content JSON');
    } catch (parseError) {
      console.error('Failed to parse content JSON:', parseError);
      generatedContent = {
        sections: [
          {
            title: "Generated Content",
            content: responseText.replace(/```/g, '').replace(/json/g, ''),
            design: { layout: "flex" }
          }
        ],
        globalMeta: {
          title: "Generated Website",
          description: "Website created with Brix.AI"
        }
      };
    }

    const websitePrompt = `
Generate a complete, minimalistic,Neumorphism website using Tailwind CSS for this content: ${JSON.stringify(generatedContent)}

Technical Requirements:
1. Use semantic HTML5 elements.
2. Implement responsive design using Tailwind's responsive prefixes.
3. Use a color scheme that is modern and matches the ${detectedTheme} theme as specified in the content prompt.
4. Include these features:
   - Responsive navigation with a hamburger menu.
   - Header links  must be implemented as internal anchor links that redirect smoothly to their respective sections.
   - Hero section with gradient background and, if possible, a typing effect for the main headline.
   - Feature grid with hover effects.
   - Testimonial carousel.
   - Contact section with form validation.
   - Footer with social links.
5. Add these interactive elements:
   - Color scheme matching the theme.
   - Smooth scroll behavior.
   - Hover animations using Tailwind's transition classes.
   - Mobile menu toggle.
   - Form validation.
   - Intersection Observer for scroll animations.
6. Include accessibility features:
   - ARIA labels.
   - Focus states.
   
7. Use Tailwind's built-in animations and transitions.
8. Implement proper spacing using Tailwind's spacing utilities.
9. Use Tailwind's container and max-width utilities.
10. Include proper meta tags and structured data.
11. For images display a placeholder saying "Put Image here".
12. Ensure JavaScript-based animations are included for dynamic interactions.

Return only the complete HTML code with embedded Tailwind CSS classes and necessary JavaScript. DO NOT include any markdown formatting or code blocks - just the raw HTML.`;

    console.log('Sending website prompt to Gemini API...');
    const websiteResult = await withRetry(() => model.generateContent(websitePrompt));
      
    const websiteResponse = await websiteResult.response;
    console.log('Received website response, length:', websiteResponse.text().length);
    
    // Get the raw response text
    let rawResponse = websiteResponse.text();
    
    // Log the first part to help with debugging
    console.log('Website response starts with:', rawResponse.substring(0, 100).replace(/\n/g, '\\n'));
    
    // Check if the response is wrapped in markdown code blocks and extract the HTML
    let generatedCode = rawResponse;
    
    // Remove markdown code blocks if present
    if (rawResponse.includes('```html') || rawResponse.includes('```')) {
      const htmlMatch = rawResponse.match(/```(?:html)?\s*([\s\S]*?)```/);
      if (htmlMatch) {
        console.log('Found HTML in markdown code block');
        generatedCode = htmlMatch[1].trim();
      }
    }
    
    // Clean up any non-HTML prefixes or explanatory text
    if (!generatedCode.trim().startsWith('<!DOCTYPE') && !generatedCode.trim().startsWith('<html')) {
      const htmlStart = generatedCode.indexOf('<!DOCTYPE') > -1 ? 
                        generatedCode.indexOf('<!DOCTYPE') : 
                        generatedCode.indexOf('<html');
      
      if (htmlStart > -1) {
        console.log('Found HTML starting at position:', htmlStart);
        generatedCode = generatedCode.substring(htmlStart);
      }
    }
    
    // Simplify doctype if needed
    generatedCode = generatedCode.replace(/<!DOCTYPE[^>]*>/i, '<!DOCTYPE html>');
    
    console.log('Processed code length:', generatedCode.length);

    // Process the generated code to add additional features and fixes
    const processedCode = generatedCode
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
          <style>
            /* Fix any coffee-* classes by replacing them with primary/secondary/etc */
            .text-coffee-dark { color: var(--color-primary) !important; }
            .text-coffee-medium { color: var(--color-secondary) !important; }
            .bg-coffee-dark { background-color: var(--color-primary) !important; }
            .bg-coffee-medium { background-color: var(--color-secondary) !important; }
            .bg-coffee-lightest { background-color: var(--color-background) !important; }
            .bg-coffee-lighter { background-color: var(--color-accent) !important; }
            .hover\\:bg-coffee-dark:hover { background-color: var(--color-primary) !important; }
            .hover\\:bg-coffee-medium:hover { background-color: var(--color-secondary) !important; }
            .hover\\:text-coffee-medium:hover { color: var(--color-secondary) !important; }
            .border-coffee-medium { border-color: var(--color-secondary) !important; }
            
            :root {
              --color-primary: ${colors.primary || '#3d2c22'};
              --color-secondary: ${colors.secondary || '#70543e'};
              --color-accent: ${colors.accent || '#e6d8c9'};
              --color-background: ${colors.background || '#f7f3ed'};
              --color-text: ${colors.text || '#3d2c22'};
            }
            
            body {
              color: var(--color-text);
              background-color: var(--color-background);
            }
          </style>
      `)

    // Extract the main content from between <body> and </body>
    let mainContent = processedCode.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    mainContent = mainContent ? mainContent[1] : processedCode;

    // Generate a properly structured website with our template
    const structuredWebsite = generateTemplate({
      colors: colors,
      title: generatedContent.globalMeta?.title || 'Website Generated by Brix.AI',
      meta: generatedContent.globalMeta || {}
    }, mainContent);

    // Send both 'completion' and 'complete' events to ensure the client receives it
    sendToAllClients({ 
      type: 'completion', 
      data: {
        code: structuredWebsite,
        content: generatedContent,
        metadata: {
          type: websiteType,
          colorScheme,
          style,
          brandTone,
          generated: new Date().toISOString(),
          features: websiteTemplates[websiteType]?.features || [],
          defaultClasses: websiteTemplates[websiteType]?.defaultClasses || {}
        }
      }
    });
    
    // Also send with simplified structure in case frontend expects it this way
    sendToAllClients({ 
      type: 'complete', 
      code: structuredWebsite,
      content: generatedContent,
      metadata: {
        type: websiteType
      }
    });
    
    console.log('Website generation completed successfully');
  } catch (error) {
    console.error('Error in /generate endpoint:', error);
    // Send error via SSE instead of using res directly
    sendToAllClients({ 
      type: 'error', 
      message: 'Failed to generate website', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Add middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// SSE endpoint for real-time progress updates during website generation
const DEBUG_SSE = true;

app.get('/generate-sse', (req, res) => {
  const clientId = Date.now();
  
  if (DEBUG_SSE) {
    console.log(`SSE connection request received from client ${clientId}`);
    console.log(`Request headers:`, req.headers);
  }
  
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  
  // Send a heartbeat immediately to keep the connection alive
  res.write(': heartbeat\n\n');
  
  // Send a connection established message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established', id: clientId })}\n\n`);
  
  if (DEBUG_SSE) {
    console.log(`Initial SSE messages sent to client ${clientId}`);
  }
  
  // Store the connection
  connections.set(clientId, res);
  
  // Set up a heartbeat to keep the connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
      if (DEBUG_SSE && Math.random() < 0.1) {  // Only log occasionally to avoid spam
        console.log(`Heartbeat sent to client ${clientId}`);
      }
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
  
  if (DEBUG_SSE) {
    console.log(`Client ${clientId} connected to SSE - connection active`);
    console.log(`Total active SSE connections: ${connections.size}`);
  }
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
    generateWebsite(prompt, res);
  } catch (error) {
    console.error('Error starting generation:', error);
    res.status(500).json({ error: 'Failed to start generation', details: error.message });
  }
});

// Helper function to send updates to all connected clients
function sendToAllClients(data) {
  console.log(`Sending to ${connections.size} clients: ${data.type}`);
  if (connections.size === 0) {
    console.warn('No active SSE connections to send data to');
  }
  
  const formattedData = data.type === 'completion' ? {
    ...data,
    // Ensure code is properly serialized if it exists
    data: {
      ...data.data,
      code: data.data.code,
      content: data.data.content
    }
  } : data;
  
  connections.forEach((client, clientId) => {
    try {
      client.write(`data: ${JSON.stringify(formattedData)}\n\n`);
    } catch (error) {
      console.error(`Error sending data to client ${clientId}:`, error);
      // Clean up broken connections
      connections.delete(clientId);
    }
  });
}

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

// Existing POST endpoint for chat
app.post('/chat', async (req, res) => {
  try {
    const { message, conversationContext = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`Received chat message, context length: ${conversationContext.length}`);
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Prepare conversation history for context if provided
    if (conversationContext && conversationContext.length > 0) {
      try {
        // Convert conversation history to a format Gemini can use
        const formattedContext = conversationContext.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));
        
        // Create a chat session with history
        const chat = model.startChat({
          history: formattedContext.slice(0, -1),  // All messages except the last one
          generationConfig: {
            maxOutputTokens: 1000,
          },
          systemInstruction: `You are Brix.AI, a friendly website generator assistant.

Your first interaction with every user should ask if they want:
1. Guidance for determining their website requirements through a series of questions, or
2. To directly provide their own website prompt

If they want guidance, walk them through these questions one by one:
- What type of website do you need? (business, portfolio, e-commerce, blog, etc.)
- What industry or niche is your website for?
- What colors or visual style do you prefer?
- What specific features do you need? (contact form, gallery, shop, etc.)
- Who is your target audience?

If they want to provide their own prompt:
- Ask them to describe the website they want in detail
- Take their description exactly as provided and format it into a prompt for the generator
- Offer the formatted prompt for them to use with the website generator

Always be helpful, friendly, and respect the user's choice. Remember previous parts of the conversation to provide personalized assistance.`
        });
        
        // Send the last user message to continue the conversation
        const lastMessage = conversationContext[conversationContext.length - 1];
        const result = await withRetry(() => 
          chat.sendMessage(lastMessage.content)
        );
        const response = await result.response;
        
        console.log('Successfully generated response with context');
        
        res.json({ 
          response: response.text(),
          timestamp: new Date().toISOString()
        });
      } catch (contextError) {
        console.error('Error using chat history:', contextError);
        
        // Fall back to simple prompt if there's an issue with the chat history
        const prompt = `You are Brix.AI, a friendly website generator assistant. 
The user has been talking with you about website requirements.

Previous messages (for context only):
${conversationContext.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}

The user's latest message is: "${message}"

Provide a clear, and helpful response, keeping it focused and direct. Remember that we're discussing website generation.`;

        const result = await withRetry(() => model.generateContent(prompt));
        const response = await result.response;
        
        console.log('Used fallback approach due to context error');
        
        res.json({ 
          response: response.text(),
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // First message without conversation history - start with options
      const prompt = `You are Brix.AI, a friendly website generator assistant.

As this is our first interaction, welcome the user and ask if they would prefer:
1. Step-by-step guidance on determining their website requirements through a series of questions, or
2. To directly provide their own website description for immediate prompt generation

The message from the user is: "${message}"

If they've already indicated which option they prefer in their message, respond accordingly.
If they just want a prompt, take their description and format it as a clear prompt for the website generator.

Keep your response friendly, clear, and focused on helping the user generate the best website possible.`;

      const result = await withRetry(() => model.generateContent(prompt));
      const response = await result.response;
      
      res.json({ 
        response: response.text(),
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to process message', 
      details: error.message 
    });
  }
});

// Add new GET endpoint for chat that works with query parameters
app.get('/chat', async (req, res) => {
  try {
    const { message } = req.query;
    const conversationContext = req.query.conversationContext 
      ? JSON.parse(req.query.conversationContext) 
      : [];
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`Received chat message via GET, context length: ${conversationContext.length}`);
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Prepare conversation history for context if provided
    if (conversationContext && conversationContext.length > 0) {
      try {
        // Convert conversation history to a format Gemini can use
        const formattedContext = conversationContext.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));
        
        // Create a chat session with history
        const chat = model.startChat({
          history: formattedContext.slice(0, -1),  // All messages except the last one
          generationConfig: {
            maxOutputTokens: 1000,
          },
          systemInstruction: `You are Brix.AI, a friendly website generator assistant.

Your first interaction with every user should ask if they want:
1. Guidance for determining their website requirements through a series of questions, or
2. To directly provide their own website prompt

If they want guidance, walk them through these questions one by one:
- What type of website do you need? (business, portfolio, e-commerce, blog, etc.)
- What industry or niche is your website for?
- What colors or visual style do you prefer?
- What specific features do you need? (contact form, gallery, shop, etc.)
- Who is your target audience?

If they want to provide their own prompt:
- Ask them to describe the website they want in detail
- Take their description exactly as provided and format it into a prompt for the generator
- Offer the formatted prompt for them to use with the website generator

Always be helpful, friendly, and respect the user's choice. Remember previous parts of the conversation to provide personalized assistance.`
        });
        
        // Send the last user message to continue the conversation
        const lastMessage = conversationContext[conversationContext.length - 1];
        const result = await withRetry(() => 
          chat.sendMessage(lastMessage.content)
        );
        const response = await result.response;
        
        console.log('Successfully generated response with context');
        
        res.json({ 
          response: response.text(),
          timestamp: new Date().toISOString()
        });
      } catch (contextError) {
        console.error('Error using chat history:', contextError);
        
        // Fall back to simple prompt if there's an issue with the chat history
        const prompt = `You are Brix.AI, a friendly website generator assistant. 
The user has been talking with you about website requirements.

Previous messages (for context only):
${conversationContext.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}

The user's latest message is: "${message}"

Provide a clear, and helpful response, keeping it focused and direct. Remember that we're discussing website generation.`;

        const result = await withRetry(() => model.generateContent(prompt));
        const response = await result.response;
        
        console.log('Used fallback approach due to context error');
        
        res.json({ 
          response: response.text(),
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // First message without conversation history - start with options
      const prompt = `You are Brix.AI, a friendly website generator assistant.

As this is our first interaction, welcome the user and ask if they would prefer:
1. Step-by-step guidance on determining their website requirements through a series of questions, or
2. To directly provide their own website description for immediate prompt generation

The message from the user is: "${message}"

If they've already indicated which option they prefer in their message, respond accordingly.
If they just want a prompt, take their description and format it as a clear prompt for the website generator.

Keep your response friendly, clear, and focused on helping the user generate the best website possible.`;

      const result = await withRetry(() => model.generateContent(prompt));
      const response = await result.response;
      
      res.json({ 
        response: response.text(),
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to process message', 
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Brix.AI Server running on port ${port}`);
  console.log(`API key configured: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`Supported color schemes: ${Object.keys(themeKeywords).join(', ')}`);
});

// Export functions for testing or external use if needed
module.exports = { getThemeColors, themeKeywords };