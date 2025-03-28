/**
 * Utility function to convert markdown to JSON
 * This is used by the backend to process content
 */

/**
 * Converts markdown content to a structured JSON object
 * @param {string} markdown - The markdown content to convert
 * @returns {Object} Structured JSON representation of the markdown
 */
function markdownToJson(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return { content: [], metadata: {} };
  }

  const lines = markdown.split('\n');
  const result = {
    content: [],
    metadata: {}
  };
  
  // Process metadata if it exists (YAML frontmatter)
  let metadataSection = false;
  let metadataLines = [];
  let contentStartIndex = 0;
  
  if (lines[0] && lines[0].trim() === '---') {
    metadataSection = true;
    contentStartIndex = 1; // Skip the first line
    
    for (let i = 1; i < lines.length; i++) {
      contentStartIndex = i + 1;
      
      if (lines[i].trim() === '---') {
        metadataSection = false;
        break;
      }
      
      metadataLines.push(lines[i]);
    }
  }
  
  // Parse metadata
  if (metadataLines.length > 0) {
    metadataLines.forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        
        // Try to parse JSON values
        try {
          result.metadata[key] = JSON.parse(value);
        } catch (e) {
          // If it's not valid JSON, store as string
          result.metadata[key] = value;
        }
      }
    });
  }
  
  // Process content
  let currentSection = null;
  
  for (let i = contentStartIndex; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for headers to identify sections
    if (line.startsWith('# ')) {
      // Level 1 heading - main section
      currentSection = {
        type: 'section',
        title: line.substring(2).trim(),
        content: []
      };
      result.content.push(currentSection);
    } else if (line.startsWith('## ')) {
      // Level 2 heading - subsection
      if (currentSection) {
        const subsection = {
          type: 'subsection',
          title: line.substring(3).trim(),
          content: []
        };
        currentSection.content.push(subsection);
        currentSection = subsection; // Set current context to subsection
      }
    } else if (line.trim() !== '') {
      // Add non-empty lines to the current section
      if (currentSection) {
        currentSection.content.push({
          type: 'paragraph',
          text: line.trim()
        });
      } else {
        // If no section has been created yet, add to root
        result.content.push({
          type: 'paragraph',
          text: line.trim()
        });
      }
    }
  }
  
  return result;
}

/**
 * Converts JSON structure back to markdown
 * @param {Object} json - The JSON object to convert
 * @returns {string} Markdown representation
 */
function jsonToMarkdown(json) {
  if (!json || typeof json !== 'object') {
    return '';
  }
  
  let markdown = '';
  
  // Add metadata as YAML frontmatter if it exists
  if (json.metadata && Object.keys(json.metadata).length > 0) {
    markdown += '---\n';
    Object.entries(json.metadata).forEach(([key, value]) => {
      let stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      markdown += `${key}: ${stringValue}\n`;
    });
    markdown += '---\n\n';
  }
  
  // Process content
  if (json.content && Array.isArray(json.content)) {
    json.content.forEach(item => {
      if (item.type === 'section') {
        markdown += `# ${item.title}\n\n`;
        
        if (item.content && Array.isArray(item.content)) {
          item.content.forEach(subItem => {
            if (subItem.type === 'subsection') {
              markdown += `## ${subItem.title}\n\n`;
              
              if (subItem.content && Array.isArray(subItem.content)) {
                subItem.content.forEach(paragraph => {
                  if (paragraph.type === 'paragraph') {
                    markdown += `${paragraph.text}\n\n`;
                  }
                });
              }
            } else if (subItem.type === 'paragraph') {
              markdown += `${subItem.text}\n\n`;
            }
          });
        }
      } else if (item.type === 'paragraph') {
        markdown += `${item.text}\n\n`;
      }
    });
  }
  
  return markdown.trim();
}

module.exports = {
  markdownToJson,
  jsonToMarkdown
}; 