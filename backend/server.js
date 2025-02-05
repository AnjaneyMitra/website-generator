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
};
app.use(cors(corsOptions));
app.use(express.json());

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

app.post('/generate', async (req, res) => {
  try {
    const { 
      prompt,
      websiteType = 'business',
      colorScheme = 'modern',
      style = 'minimal',
      brandTone = 'professional'
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const detectedTheme = analyzePromptForTheme(prompt);
    const colors = getThemeColors(prompt);


    const contentPrompt = `
Generate website content for a ${websiteType} website with the following details:
"${prompt}"

Requirements:
1. Use a visually engaging style with ${detectedTheme}-themed designs and icons
2. Tone of voice: ${brandTone}
3. Use the ${detectedTheme} theme colors throughout the design
4. Include all necessary sections for a ${websiteType} website
5. Generate real, contextual content (not lorem ipsum)
6. Focus on clear call-to-actions and user engagement
7. Consider responsive design and mobile-first approach
8. Include meta descriptions and title tags
9. Suggest image descriptions and placements
10. Only create forms if explicitly requested
11. Specify interactive elements and animations

Return the response in valid JSON format with this structure:
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
          "hover": "scale|glow"
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
}`;

    const contentResult = await model.generateContent(contentPrompt);
    const contentResponse = await contentResult.response;
    const generatedContent = ensureJsonResponse(contentResponse.text());

    const websitePrompt = `
Generate a complete, modern website using Tailwind CSS for this content: ${JSON.stringify(generatedContent)}

Technical Requirements:
1. Use semantic HTML5 elements
2. Implement responsive design using Tailwind's responsive prefixes
3. Use a color scheme that is modern and matches with the request 
4. Include these features:
    
   - Responsive navigation with hamburger menu
   - Hero section with gradient background
   - Feature grid with hover effects
   - Testimonial carousel
   - Contact section with form validation
   - Footer with social links
5. Add these interactive elements:
   - Use a minimal color scheme
   - Smooth scroll behavior
   - Hover animations using Tailwind's transition classes
   - Mobile menu toggle
   - Form validation
   - Intersection Observer for scroll animations
6. Include accessibility features:
   - ARIA labels
   - Focus states
   - Skip to main content
7. Use Tailwind's built-in animations and transitions

8. Implement proper spacing using Tailwind's spacing utilities
9. Use Tailwind's container and max-width utilities
10. Include proper meta tags and structured data
11. For images display a placeholder saying "Put Image here"
Return only the complete HTML code with embedded Tailwind CSS classes and necessary JavaScript.
Do not include any markdown formatting or code blocks.`;

    const result = await model.generateContent(websitePrompt);
    const response = await result.response;
    const generatedCode = response.text().replace(/```html\n?|\n?```/g, '').trim();

    const processedCode = generatedCode
      .replace(/placehold\.co/g, 'picsum.photos')
      .replace(/<head>/, `
        <head>
          <!-- Generated by Brix.AI -->
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  colors: ${JSON.stringify(colors)}
                }
              }
            }
          </script>
      `)
      .replace('</body>', `
          <script>
            // Initialize smooth scroll
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
              anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                  behavior: 'smooth'
                });
              });
            });

            // Mobile menu toggle
            const mobileMenu = document.querySelector('[data-mobile-menu]');
            const mobileMenuButton = document.querySelector('[data-mobile-menu-button]');
            if (mobileMenuButton) {
              mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
              });
            }

            // Intersection Observer for animations
            const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  entry.target.classList.add('motion-safe:animate-fadeIn');
                }
              });
            }, { threshold: 0.1 });

            document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
          </script>
        </body>
      `);

    res.json({ 
      code: processedCode,
      content: generatedContent,
      metadata: {
        type: websiteType,
        colorScheme,
        style,
        brandTone,
        generated: new Date().toISOString(),
        features: websiteTemplates[websiteType].features,
        defaultClasses: websiteTemplates[websiteType].defaultClasses
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate website', 
      details: error.message 
    });
  }
});

app.get('/color-schemes', (req, res) => {
  res.json(colorSchemes);ßß
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

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
   const prompt = `You are Brix.AI, a friendly website generator assistant. 
Provide a clear, and helpful response to: "${message}"
Keep responses focused and direct`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    res.json({ 
      message: response.text(),
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