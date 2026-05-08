import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { title, context } = await req.json();
    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      return NextResponse.json({ error: "Groq API Key missing" }, { status: 500 });
    }

    const systemPrompt = `You are a World-Class SEO Journalist and Content Strategist.
I am providing you with a trending news topic. Write a comprehensive, highly-engaging news article optimized for search engines.

CRITICAL CONTENT REQUIREMENTS:
1. The 'content' field must be a heavily structured HTML news article (800+ words).
2. Include an engaging introductory hook, a 'Key Takeaways' bulleted list, 3+ detailed <h2> subsections diving deep into the context, impacts, and public interest.
3. Strategically place natural LSI (Latent Semantic Indexing) keywords throughout. Use bold <strong> text for important entities and keywords.
4. Add a short 'Frequently Asked Questions (FAQs)' section at the end of the content using <h3> tags to capture long-tail search traffic.
5. Ensure 'imageAltText' provides a deeply descriptive, highly SEO-optimized Alt sentence detailing the main image for Google Image Search indexing.

Output EXACTLY a JSON string with the following schema, and NO other markdown or conversational text outside it:
{
  "seoHeading": "Primary H1 heading (catchy, keyword rich)",
  "seoTitle": "Meta title under 60 characters",
  "metaDescription": "SEO meta description under 160 characters, designed to maximize CTR",
  "slug": "url-friendly-slug-like-this",
  "imageRename": "seo-friendly-high-volume-keywords.jpg",
  "imageAltText": "Extremely detailed, highly optimized alt text describing the event and context for Google Image Search",
  "shortSummary": "A powerful 2-sentence summary hook",
  "content": "The full HTML formatted article body using <h2>, <h3>, <ul>, and <p> tags. Must include intro, Key Takeaways, detailed body paragraphs, and FAQs.",
  "imagePrompt": "A highly descriptive, photorealistic Midjourney-style prompt describing the main event to be used for thumbnail generation"
}`;

    const userMessage = `Topic: ${title}\nContext: ${context}`;

    // Using llama-3.3-70b-versatile directly as the most stable active model 
    const model = 'llama-3.3-70b-versatile';

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
         model: model,
         messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
         ],
         temperature: 0.5,
         response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || "Groq API Failed");
    }

    // Groq returns OpenAI format
    const contentText = data.choices[0].message.content;
    const resultJson = JSON.parse(contentText);

    // Clean up any stray markdown asterisks that Groq might have used instead of HTML
    if (resultJson.content) {
      resultJson.content = resultJson.content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    return NextResponse.json(resultJson);

  } catch (error) {
    console.error("Article gen error (Groq):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
