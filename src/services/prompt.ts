/**
 * Prompt Service for generating AI prompts and template detection
 */

import { WEBSITE_TEMPLATES } from '../shared/constants';
import { logger } from '../shared/logger';
import type { WebsiteTemplate } from '../shared/types';

export class PromptService {
  constructor() {
    logger.info('Initializing Prompt Service', {
      component: 'PromptService',
      method: 'constructor',
    });
  }

  /**
   * Generate intelligent prompt based on URL
   */
  public generatePrompt(url: string): string {
    const domain = this.extractDomain(url);
    const template = this.detectWebsiteTemplate(domain);
    const urlPath = url.replace(/^https?:\/\/[^\/]+/, '') || '/';

    return `RECREATE the website for: ${url}

DOMAIN: ${domain}
SPECIFIC PAGE/SECTION: ${urlPath}
WEBSITE TYPE: ${template.name} (${template.description})

CRITICAL INSTRUCTIONS:
If you have specific knowledge about this website from your training data, recreate the ACTUAL website as it appeared. However, if you don't have detailed information about this specific domain, be CREATIVE and design an appropriate website that would make sense for this domain name and context.

RECREATION APPROACH:
1. FIRST: Check if you have specific knowledge about ${domain} from your training data
2. If YES: Recreate the ACTUAL website with exact visual design, color scheme, and layout
3. If NO: Be CREATIVE and design an appropriate website that fits the domain name and context

PIXEL-PERFECT RECREATION REQUIREMENTS:
- Recreate the website using ONLY HTML and CSS with maximum visual accuracy
- Be extremely faithful to the original website's look and feel, color scheme, typography, and layout
- Use precise CSS to match the authentic visual appearance, spacing, and design elements
- Focus on exact visual details: button styles, form elements, navigation design, and page structure
- If the website doesn't exist in your training data, be creative and design an appropriate website based on similar sites you know

DESIGN APPROACH:
- If you have training data about ${domain}: Recreate the EXACT visual design, color scheme, layout, and branding with pixel-perfect accuracy
- If no training data: Think deeply about what this website SHOULD be based on its purpose and audience
- Avoid generic corporate/B2B templates - create something specific and tasteful for the actual content and audience
- Use your knowledge of similar websites with comparable purposes, not just similar industries
- Focus on authentic content presentation rather than conversion optimization
- Create a design that serves the content, not sells the content

CONTENT AND VISUAL REQUIREMENTS:
- Create content appropriate for ${urlPath} using domain-specific terminology and style
- Include realistic data, names, and information appropriate to the organization
- Recreate the ACTUAL color palette, fonts, typography, spacing, and layout patterns (if known from training data)
- Pay attention to exact visual details: button styles, form elements, navigation design, and page structure
- If not known, draw inspiration from similar websites in your training data to create a believable design

IMAGE GUIDELINES:
- Use authentic logos and images from your training data for ${domain} (if known)
- Include alt text for accessibility and use modern image formats
- Consider CSS gradients and SVG icons as lightweight alternatives

IMPORTANT: Structure your response using these exact XML tags:

<thinking>
Take time to carefully assess your knowledge about ${domain} from your training data. Do you have specific, detailed information about this website's visual design, layout, and content?

If YES, think deeply about the EXACT visual appearance and recreate it with pixel-perfect accuracy. Consider every detail: the specific color scheme, typography choices, layout structure, spacing, button styles, navigation design, and overall visual hierarchy. Explain how you're matching the authentic look and feel, including specific visual elements that make this website recognizable.

If NO, think deeply about what this website SHOULD be, not what it could be. Consider:
- What is the purpose and audience of this website?
- What type of content would be most valuable and authentic?
- What visual style would be appropriate for this subject matter?
- What websites in your training data have similar purposes or audiences?
- How can you create something tasteful and specific rather than generic?

Avoid defaulting to corporate/B2B landing page styles. Instead, think about the actual content, purpose, and audience. For example:
- A blog should look like a blog, not a sales page
- A portfolio should showcase work, not push services
- A research site should prioritize content, not conversions
- A personal site should reflect personality, not business goals

For the specific path "${urlPath}", think about what content would realistically appear here. What would visitors actually want to find on this page? What would be the most natural and useful content organization?

Take your time to get this right - focus on creating something tasteful, appropriate, and authentic rather than generic or sales-focused.
</thinking>

<code>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${domain}</title>
    <style>
        /* Recreate the exact visual design with precise CSS */
    </style>
</head>
<body>
    <!-- Recreate the authentic HTML structure and content -->
</body>
</html>
</code>

CRITICAL: 
- Use the exact XML tags shown above
- Put ALL explanatory text in <thinking> tags
- Put ONLY the complete HTML document in <code> tags
- Start with <!DOCTYPE html> and end with </html>
- Create functional internal links using relative URLs (e.g., href="/about", href="/contact")
- Include a navigation menu with working links to common pages
- Focus on pixel-perfect visual accuracy above all else`;
  }

  /**
   * Extract domain from URL
   */
  public extractDomain(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace('www.', '');
    }
  }

  /**
   * Detect website template based on domain
   */
  public detectWebsiteTemplate(_domain: string): WebsiteTemplate {
    // No template detection - let the AI be completely creative
    // Use a generic template as fallback, but the AI should ignore the type and be creative
    const corporateTemplate = WEBSITE_TEMPLATES.find((t) => t.type === 'corporate');
    if (corporateTemplate) return corporateTemplate;

    // Fallback to first template if corporate not found
    return WEBSITE_TEMPLATES[0];
  }

  /**
   * Get available website templates
   */
  public getAvailableTemplates(): WebsiteTemplate[] {
    return [...WEBSITE_TEMPLATES];
  }

  /**
   * Get template by type
   */
  public getTemplateByType(type: string): WebsiteTemplate | undefined {
    return WEBSITE_TEMPLATES.find((t) => t.type === type);
  }
}
