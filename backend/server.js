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

const colorSchemes = {
  modern: {
    primary: '#2D3436',
    secondary: '#636E72',
    accent: '#0984E3',
    background: '#FFFFFF',
    text: '#2D3436'
  },
  minimal: {
    primary: '#000000',
    secondary: '#333333',
    accent: '#666666',
    background: '#FFFFFF',
    text: '#000000'
  },
  warm: {
    primary: '#C0392B',
    secondary: '#E74C3C',
    accent: '#D35400',
    background: '#FFF5F5',
    text: '#2C3E50'
  }
};

const websiteTemplates = {
  business: {
    sections: ['hero', 'services', 'about', 'testimonials', 'contact'],
    contentTypes: ['company description', 'service offerings', 'team information', 'client reviews']
  },
  portfolio: {
    sections: ['intro', 'projects', 'skills', 'experience', 'contact'],
    contentTypes: ['personal bio', 'project showcases', 'technical skills', 'work history']
  },
  ecommerce: {
    sections: ['featured', 'products', 'categories', 'about', 'contact'],
    contentTypes: ['product descriptions', 'pricing information', 'category descriptions']
  }
};

// Helper function to ensure JSON response from AI
const ensureJsonResponse = (text) => {
  try {
    // First attempt to parse as is
    return JSON.parse(text);
  } catch (e) {
    // If it fails, try to extract JSON-like content
    try {
      // Look for content between triple backticks if present
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }
      
      // If no JSON blocks found, try to convert markdown-style content to JSON
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

    const contentPrompt = `
      Generate website content for a ${websiteType} website with the following details:
      "${prompt}"
      
      Requirements:
      1. Tone of voice: ${brandTone}
      2. Include all necessary sections for a ${websiteType} website
      3. Generate real, contextual content (not lorem ipsum)
      4. Include SEO-friendly headings and descriptions
      5. Maintain consistent brand voice throughout
      6. Generate appropriate calls-to-action
      7. Include meta descriptions and title tags

      IMPORTANT: Return the response in valid JSON format with this structure:
      {
        "sections": [
          {
            "title": "section name",
            "content": "section content",
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
    `;

    const contentResult = await model.generateContent(contentPrompt);
    const contentResponse = await contentResult.response;
    const generatedContent = ensureJsonResponse(contentResponse.text());

    const websitePrompt = `
      Generate a complete, modern HTML, CSS, and JavaScript website using this content: ${JSON.stringify(generatedContent)}
      
      Technical Requirements:
      1. Use semantic HTML5 elements (header, nav, main, section, footer)
      2. Implement responsive design with mobile-first approach
      3. Include CSS custom properties for the color scheme: ${JSON.stringify(colorSchemes[colorScheme])}
      4. Use modern CSS features (Flexbox, Grid, clamp(), etc.)
      5. Optimize for performance (lazy loading, efficient selectors)
      6. Include accessibility features (ARIA labels, semantic structure)
      7. Add micro-interactions and smooth transitions
      8. Implement proper meta tags for SEO
      9. Use srcset for responsive images
      10. Include structured data markup where appropriate

      IMPORTANT: Return only the complete HTML code without any markdown formatting or code blocks.
    `;

    const result = await model.generateContent(websitePrompt);
    const response = await result.response;
    const generatedCode = response.text().replace(/```html\n?|\n?```/g, '').trim();

    const processedCode = generatedCode
      .replace(/placehold\.co/g, 'picsum.photos')
      .replace(/<head>/, `<head>\n  <!-- Generated by Brix.AI -->`);

    res.json({ 
      code: processedCode,
      content: generatedContent,
      metadata: {
        type: websiteType,
        colorScheme,
        style,
        brandTone,
        generated: new Date().toISOString()
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
  res.json(colorSchemes);
});

app.get('/templates', (req, res) => {
  res.json(websiteTemplates);
});

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Brix.AI Backend is running!',
    version: '2.0.0',
    features: [
      'Dynamic content generation',
      'Multiple color schemes',
      'Website templates',
      'SEO optimization',
      'Responsive design'
    ]
  });
});

app.listen(port, () => {
  console.log(`Brix.AI Server running at http://localhost:${port}`);
  console.log(`API Documentation available at http://localhost:${port}/docs`);
});