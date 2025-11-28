import OpenAI from "openai";
import { GoogleGenAI, Modality } from "@google/genai";
import pRetry from "p-retry";
import { storage } from "./storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Gemini AI with Nano Banana (gemini-2.5-flash-image) for high-quality image generation
const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

export interface GenerationConfig {
  style: string;
  primaryLanguage: string;
  targetLanguages: string[];
}

export interface ChapterOutline {
  title: string;
  description: string;
  keywords: string[];
}

export interface GeneratedContent {
  title: string;
  content: string;
  imagePrompt?: string;
}

export class AIService {
  private async getApiClient(userId: string, type: string): Promise<OpenAI> {
    const configs = await storage.getApiConfigs(userId);
    const activeConfig = configs.find(c => c.type === type && c.isActive === 1);
    
    if (activeConfig) {
      return new OpenAI({
        apiKey: activeConfig.apiKey,
        baseURL: activeConfig.baseUrl || undefined,
      });
    }
    
    return openai;
  }
  // Analyze trends and select a commercial topic
  async analyzeTrends(userId: string, style: string): Promise<string> {
    const stylePrompts: Record<string, string> = {
      modern_mag: "trending lifestyle and wellness topics with high visual appeal",
      recipe_book: "viral food trends and popular cuisines (keto, vegan, etc.)",
      minimalist: "productivity hacks and minimalist living guides",
      vibrant: "pop culture and social media trending topics",
    };

    const prompt = `You are a market analyst. Based on current trends, suggest ONE high-commercial-potential topic for a ${stylePrompts[style] || stylePrompts.modern_mag} ebook.
    
Requirements:
- Short, punchy titles (30-50 pages max)
- High social media shareability
- Visual-heavy potential
- Broad appeal

Return ONLY the topic title (e.g., "The Viral Keto Breakfast Bowl Guide 2025")`;

    const client = await this.getApiClient(userId, "reasoning");
    const configs = await storage.getApiConfigs(userId);
    const reasoningConfig = configs.find(c => c.type === "reasoning" && c.isActive === 1);
    const model = reasoningConfig?.model || "gpt-4o-mini";

    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    return completion.choices[0].message.content?.trim() || "Trending Guide 2025";
  }

  // Generate an outline for the book
  async generateOutline(userId: string, title: string, style: string, language: string = "en"): Promise<ChapterOutline[]> {
    const styleContext: Record<string, string> = {
      modern_mag: "magazine-style layout with 8-10 short visual sections",
      recipe_book: "6-8 recipes with step-by-step instructions and ingredient lists",
      minimalist: "10-12 minimalist tips with clean, simple structure",
      vibrant: "8-10 colorful, engaging chapters with bold visuals",
    };

    const prompt = `Create an outline for a commercial ebook titled "${title}".
    
Style: ${styleContext[style] || styleContext.modern_mag}
Language: ${language}
Target: 35-50 pages total

Return a JSON array of chapters with this structure:
[
  {
    "title": "Chapter title",
    "description": "2-sentence description",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
]

Keep it commercial, punchy, and visual-friendly.`;

    const client = await this.getApiClient(userId, "text_generation");
    const configs = await storage.getApiConfigs(userId);
    const textConfig = configs.find(c => c.type === "text_generation" && c.isActive === 1);
    const model = textConfig?.model || "gpt-4o-mini";

    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return result.chapters || [];
  }

  // Generate content for a single chapter
  async generateChapterContent(
    userId: string,
    chapterTitle: string,
    chapterDescription: string,
    style: string,
    language: string = "en"
  ): Promise<GeneratedContent> {
    const styleInstructions: Record<string, string> = {
      modern_mag: "Magazine style with BOLD headlines, punchy paragraphs, dramatic callouts. Use energy words like 'stunning', 'revolutionary', 'game-changing'. Add quotes and expert tips.",
      recipe_book: "Complete recipe with vivid descriptions. Paint sensory details: 'crispy golden edges', 'silky smooth texture', 'aromatic spices'. Include pro chef tips and flavor variations.",
      minimalist: "Clean, powerful prose. Short sentences. Bold verbs. No fluff. Each word earns its place. Actionable, transformative advice.",
      vibrant: "HIGH ENERGY writing! Use enthusiasm, exclamation points, power words. Social media-ready hooks. Make readers EXCITED to try this!",
    };

    const prompt = `Write DYNAMIC, ENGAGING, PERFECTLY FORMATTED content for this chapter - make it magazine-quality!

**Chapter:** ${chapterTitle}
**Description:** ${chapterDescription}
**Style:** ${styleInstructions[style] || styleInstructions.recipe_book}
**Language:** ${language}
**Length:** 600-900 words

🎯 **MANDATORY FORMATTING RULES - FOLLOW EXACTLY:**
1. EVERY PARAGRAPH must use <p> tags (no other tags for body text)
2. Use <strong> for AT LEAST 8-12 key words, measurements, concepts
3. Use <em> for emphasis and sensory descriptions
4. MUST include at least ONE <ul> list with 4-8 items
5. MUST include at least ONE <blockquote> with a pro tip
6. Use <h3> for 2-3 sub-sections
7. Make text DYNAMIC with varied sentence lengths
8. Add personality - conversational yet professional

📐 **EXACT HTML STRUCTURE YOU MUST FOLLOW:**

<p>Start with a <strong>powerful hook</strong> that grabs attention. Paint a <em>vivid sensory picture</em> - describe what readers will see, smell, taste.</p>

<p>Second paragraph builds on the hook. Use <strong>specific numbers</strong> and <strong>concrete details</strong>. Make it feel real and achievable.</p>

<h3>Ingredients You'll Need</h3>
<ul>
<li><strong>2 cups</strong> of [ingredient] - describe the texture, color, or quality</li>
<li><strong>1 tablespoon</strong> of [spice/ingredient] - add flavor notes or why it matters</li>
<li><strong>3-4 pieces</strong> of [item] - be specific about preparation</li>
<li>[Continue with 5-8 items total, each with <strong> measurements]</li>
</ul>

<p>Method paragraph explaining the <strong>critical technique</strong> or approach. Make it <em>easy to visualize</em>.</p>

<blockquote>💡 <strong>Pro Tip:</strong> Share an insider secret that elevates results - be specific!</blockquote>

<h3>The Magic Behind the Method</h3>
<p>Explain <strong>why this works</strong>. Use sensory language: "<em>crispy golden edges</em>", "<em>silky smooth texture</em>", "<em>aromatic steam rising</em>".</p>

<p>Final paragraph wraps up with enthusiasm and encouragement. Make readers <strong>excited to try this</strong>!</p>

⚠️ **CRITICAL:** Your output must be PURE HTML content ONLY - no markdown, no code blocks, no explanations. Just the formatted HTML that follows this structure.

🖼️ **Image Prompt:**
Create a detailed, specific prompt for Nano Banana (commercial food photography):
- Exact angle (overhead, 45°, close-up macro)
- Lighting (natural window light, studio, dramatic, soft)
- Color palette (warm earth tones, vibrant rainbow, moody dark, bright pastels)
- Specific props and styling
- The exact dish/scene

Return ONLY this JSON (no markdown, no code blocks):
{
  "content": "YOUR FORMATTED HTML HERE",
  "imagePrompt": "DETAILED PHOTOGRAPHY PROMPT HERE"
}`;

    const client = await this.getApiClient(userId, "text_generation");
    const configs = await storage.getApiConfigs(userId);
    const textConfig = configs.find(c => c.type === "text_generation" && c.isActive === 1);
    const model = textConfig?.model || "gpt-4o";

    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return {
      title: chapterTitle,
      content: result.content || "",
      imagePrompt: result.imagePrompt,
    };
  }

  // Generate unique, high-quality image using Nano Banana (Gemini 2.5 Flash Image)
  async generateImage(userId: string, prompt: string, chapterIndex: number = 0): Promise<string> {
    try {
      // Enhanced prompt with unique visual details per chapter
      const styleVariations = [
        "overhead flat lay shot with natural morning light",
        "close-up macro photography with shallow depth of field",
        "45-degree angle hero shot with styled background",
        "rustic wooden table setting with soft shadows",
        "bright minimalist composition with negative space",
        "cozy lifestyle shot with warm ambient lighting",
        "editorial food photography with dramatic lighting",
        "fresh ingredients scattered artfully around the dish",
      ];
      
      const colorPalettes = [
        "vibrant greens and warm earth tones",
        "bright rainbow colors with white accents",
        "rich jewel tones with gold highlights",
        "soft pastels with natural wood textures",
        "deep burgundy and forest green palette",
        "sunny yellow and orange gradient",
        "cool blues and purples with silver touches",
        "warm amber and cream tones",
      ];

      const styleIndex = chapterIndex % styleVariations.length;
      const colorIndex = chapterIndex % colorPalettes.length;
      
      const enhancedPrompt = `Professional commercial food photography: ${prompt}. ${styleVariations[styleIndex]}, ${colorPalettes[colorIndex]}. Magazine-quality, studio lighting, high resolution, appetizing presentation, editorial style. Sharp focus, rich textures, vivid details.`;

      console.log(`[Nano Banana] Generating unique image ${chapterIndex + 1}: "${enhancedPrompt.substring(0, 100)}..."`);

      // Use Nano Banana (gemini-2.5-flash-image) with retries
      const response = await pRetry(
        async () => {
          const result = await gemini.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
            config: {
              responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
          });

          const candidate = result.candidates?.[0];
          const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);
          
          if (!imagePart?.inlineData?.data) {
            throw new Error("No image data in Nano Banana response");
          }

          const mimeType = imagePart.inlineData.mimeType || "image/png";
          const base64Image = `data:${mimeType};base64,${imagePart.inlineData.data}`;
          
          console.log(`[Nano Banana] ✓ Image generated successfully (${base64Image.length} bytes)`);
          return base64Image;
        },
        {
          retries: 3,
          minTimeout: 2000,
          maxTimeout: 10000,
          onFailedAttempt: error => {
            console.log(`[Nano Banana] Attempt ${error.attemptNumber} failed. Retries left: ${error.retriesLeft}`);
          },
        }
      );

      return response;
    } catch (error) {
      console.error("[Nano Banana] Image generation failed, using fallback:", error);
      
      // Fallback to curated Pexels images (high quality, copyright-free)
      const pexelsIds = [
        "1640777", "1640774", "1640772", "1640770", "1640768",
        "1092730", "1095550", "1082343", "1640764", "1092883",
        "1600711", "1640766", "1640767", "1640769", "1640773",
      ];
      const id = pexelsIds[chapterIndex % pexelsIds.length];
      return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop`;
    }
  }

  // Generate professional marketing mockups for ebook sales
  async generateMarketingMockup(
    userId: string,
    bookTitle: string,
    coverImageUrl: string,
    mockupType: "tablet_office" | "book_3d" | "multi_device"
  ): Promise<string> {
    const mockupPrompts: Record<string, string> = {
      tablet_office: `Create a professional product photography scene: A modern sleek tablet device placed on a clean minimalist office desk at a slight angle. The tablet screen must display the EXACT ebook cover image provided. Scene includes: white ceramic coffee cup with saucer on the right, a spiral notebook with a luxury pen on the left, and soft natural window lighting creating gentle shadows on the desk surface. Background is a bright, airy office with blurred windows showing daylight. The tablet bezel is thin and modern (iPad Pro style). Photorealistic, commercial product photography, shallow depth of field focusing on the tablet screen, warm natural tones, elegant professional composition, 4K quality, lifestyle marketing shot.`,
      
      book_3d: `Create an ultra-realistic 3D physical book mockup: A premium hardcover book standing upright at a 20-degree angle showing the front cover prominently. The book cover must display the EXACT cover image provided - preserve all text, colors, and design elements perfectly. The book has a glossy laminated finish with realistic paper texture visible on the page edges (showing it's a thick, quality book). Placed on a pure white reflective surface creating a subtle mirror reflection below. Studio lighting with soft shadows from upper right, creating professional depth. Clean white background (pure white, no gradients). Premium publishing quality, photorealistic 3D rendering, commercial product shot for online bookstore, high resolution, professional book photography.`,
      
      multi_device: `Create a professional multi-device responsive mockup scene: An iMac desktop computer (center, largest device), iPad tablet (positioned to the left, medium size), and iPhone (right side, smallest) all displaying the EXACT same ebook cover image provided on their screens - the cover must be identical on all three devices. Devices are arranged on a clean light wooden desk in a modern minimalist office setting at slight angles for visual interest. Scene includes tasteful props: a small potted succulent plant (back left), wireless Apple keyboard (front), and a white ceramic coffee mug (right). Soft natural lighting from a window (left side) creating gentle shadows, clean professional composition, all device screens in sharp focus showing the cover clearly, commercial technology photography, realistic and professional, warm neutral tones, marketing shot for responsive ebook platform.`,
    };

    try {
      const prompt = mockupPrompts[mockupType];
      console.log(`[Marketing Mockup] Generating ${mockupType} mockup for "${bookTitle}" with real cover image`);

      // Extract base64 data from data URL
      let coverBase64 = "";
      let coverMimeType = "image/png";
      
      if (coverImageUrl.startsWith("data:")) {
        const matches = coverImageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          coverMimeType = matches[1];
          coverBase64 = matches[2];
        }
      }

      if (!coverBase64) {
        console.warn(`[Marketing Mockup] Cover image is not a data URL, cannot use as input. Falling back to text-only generation.`);
        // If we can't get the base64, use fallback
        return coverImageUrl;
      }

      // Use Nano Banana with the actual cover image as input
      const response = await pRetry(
        async () => {
          const result = await gemini.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [{
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: coverMimeType,
                    data: coverBase64,
                  },
                },
                {
                  text: `${prompt}\n\nIMPORTANT: Use the provided cover image EXACTLY as shown - this is the actual ebook cover for "${bookTitle}". Display it on the device screen(s) in the mockup scene. Preserve all text, colors, and design elements from the cover perfectly. Do not modify or recreate the cover design.`,
                },
              ],
            }],
            config: {
              responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
          });

          const candidate = result.candidates?.[0];
          const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);
          
          if (!imagePart?.inlineData?.data) {
            throw new Error("No image data in Nano Banana response");
          }

          const mimeType = imagePart.inlineData.mimeType || "image/png";
          const base64Image = `data:${mimeType};base64,${imagePart.inlineData.data}`;
          
          console.log(`[Marketing Mockup] ✓ ${mockupType} generated successfully with real cover (${(base64Image.length / 1024).toFixed(0)}KB)`);
          return base64Image;
        },
        {
          retries: 3,
          minTimeout: 2000,
          maxTimeout: 10000,
          onFailedAttempt: error => {
            console.log(`[Marketing Mockup] Attempt ${error.attemptNumber} failed. Retries left: ${error.retriesLeft}`);
          },
        }
      );

      return response;
    } catch (error) {
      console.error(`[Marketing Mockup] Failed to generate ${mockupType}:`, error);
      // Return the original cover image as fallback
      return coverImageUrl;
    }
  }

  // Grammar check and correction
  async checkGrammar(userId: string, content: string, language: string = "en"): Promise<string> {
    try {
      const client = await this.getApiClient(userId, "text_generation");
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: "You are a grammar correction assistant. You MUST preserve ALL HTML tags exactly as provided. Only correct the text content between tags. Never remove, alter, or add HTML tags."
        }, {
          role: "user",
          content: `Fix grammar, spelling, and punctuation errors in this HTML content.

CRITICAL RULES:
1. Preserve ALL HTML tags EXACTLY (<p>, <strong>, <em>, <ul>, <li>, <blockquote>, <h3>, etc.)
2. Only fix text content between tags
3. Do NOT convert to markdown
4. Do NOT remove or alter any HTML structure
5. Return ONLY the corrected HTML with NO additional text

Language: ${language}

HTML Content:
${content}`
        }],
        temperature: 0.2,
      });

      const result = completion.choices[0].message.content || content;
      
      // Safety check: ensure result contains HTML tags
      if (!result.includes('<') || !result.includes('>')) {
        console.warn("[Grammar Check] Warning: Result doesn't contain HTML tags, returning original");
        return content;
      }
      
      return result;
    } catch (error) {
      console.error("[Grammar Check] Failed:", error);
      return content;
    }
  }

  // Post-process HTML to ensure correct formatting
  formatHTML(html: string): string {
    let formatted = html;
    
    // Helper function to add/merge styles while preserving existing attributes
    const addStyles = (tag: string, newStyles: string): string => {
      return formatted.replace(
        new RegExp(`<${tag}([^>]*)>`, 'gi'),
        (match, attrs) => {
          // Check if style attribute exists
          const styleMatch = attrs.match(/style\s*=\s*["']([^"']*)["']/i);
          if (styleMatch) {
            // Merge new styles with existing ones
            const existingStyles = styleMatch[1];
            const mergedStyles = `${existingStyles}; ${newStyles}`.replace(/;+/g, ';').trim();
            const updatedAttrs = attrs.replace(/style\s*=\s*["'][^"']*["']/i, `style="${mergedStyles}"`);
            return `<${tag}${updatedAttrs}>`;
          } else {
            // Add new style attribute
            return `<${tag}${attrs} style="${newStyles}">`;
          }
        }
      );
    };
    
    // Add/merge styles for each element type
    formatted = addStyles('p', 'text-align: justify; margin: 1em 0');
    formatted = addStyles('ul', 'margin: 1em 0; padding-left: 2em; list-style: disc');
    formatted = addStyles('ol', 'margin: 1em 0; padding-left: 2em');
    formatted = addStyles('li', 'margin: 0.5em 0');
    formatted = addStyles('blockquote', 'border-left: 4px solid #ddd; margin: 1.5em 0; padding: 1em; background: #f9f9f9; font-style: italic; color: #666');
    formatted = addStyles('h3', 'font-size: 1.3em; margin-top: 1.5em; margin-bottom: 0.5em; color: #333');
    
    return formatted;
  }

  // Humanize AI-generated text
  async humanizeContent(userId: string, content: string, language: string = "en"): Promise<string> {
    try {
      const client = await this.getApiClient(userId, "text_generation");
      const completion = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "system",
          content: "You are a text humanization assistant. You MUST preserve ALL HTML structure exactly. Only modify the text content to sound more natural and human-like."
        }, {
          role: "user",
          content: `Make this AI-generated text sound MORE HUMAN and NATURAL while preserving ALL HTML structure.

🎯 **CRITICAL HTML PRESERVATION RULES:**
1. PRESERVE ALL HTML tags EXACTLY: <p>, <strong>, <em>, <ul>, <li>, <blockquote>, <h3>, etc.
2. Do NOT convert to markdown
3. Do NOT remove or alter HTML structure
4. Only modify TEXT CONTENT between tags

🎯 **Humanization Rules:**
1. Vary sentence structure (mix short and long)
2. Add contractions where natural ("it's", "you'll", "we're")
3. Use conversational transitions ("however", "meanwhile", "in fact")
4. Remove overly formal AI phrases ("it is important to note", "furthermore")
5. Keep enthusiasm but make it authentic
6. Add subtle personality without being cheesy

Language: ${language}

HTML Content:
${content}

Return ONLY the humanized HTML with ALL tags preserved. No markdown, no explanations.`
        }],
        temperature: 0.8,
      });

      const result = completion.choices[0].message.content || content;
      
      // Safety check: ensure result contains HTML tags
      if (!result.includes('<') || !result.includes('>')) {
        console.warn("[Humanize] Warning: Result doesn't contain HTML tags, returning original");
        return content;
      }
      
      return result;
    } catch (error) {
      console.error("[Humanize] Failed:", error);
      return content;
    }
  }

  // Translate content to another language
  async translateContent(userId: string, content: string, targetLanguage: string): Promise<string> {
    const languageNames: Record<string, string> = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
    };

    const prompt = `Translate the following content to ${languageNames[targetLanguage] || targetLanguage}. Maintain HTML formatting and structure. Keep the tone commercial and engaging.

Content:
${content}`;

    const client = await this.getApiClient(userId, "translation");
    const configs = await storage.getApiConfigs(userId);
    const translationConfig = configs.find(c => c.type === "translation" && c.isActive === 1);
    const model = translationConfig?.model || "gpt-4o";

    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    return completion.choices[0].message.content || content;
  }
}

export const aiService = new AIService();
