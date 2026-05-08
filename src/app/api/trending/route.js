import Parser from 'rss-parser';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const parser = new Parser();

    // Fetch Google News for India and US (representing Global/Western heavy traffic)
    const feedIN = await parser.parseURL('https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en');
    const feedUS = await parser.parseURL('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');

    // Extract relevant data
    const formatItem = (item, region) => {
      // Find the first news piece to give context to the prompt
      let contextSnippet = item.contentSnippet || item.description || "";
      let sourceUrl = item.link || "";

      return {
        title: item.title,
        traffic: "High CTR",
        region: region,
        context: contextSnippet,
        sourceUrl: sourceUrl,
        pubDate: item.pubDate
      };
    };

    // Grab exactly top 10 from each to hit the requested 20 topics
    const topIN = feedIN.items.slice(0, 10).map(i => formatItem(i, 'India'));
    const topUS = feedUS.items.slice(0, 10).map(i => formatItem(i, 'Worldwide'));

    const trendingTopics = [...topIN, ...topUS];

    // Sort by Date roughly to keep them mixed, or leave as IN then US
    return NextResponse.json({ trends: trendingTopics });

  } catch (error) {
    console.error("Trending fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch trending topics" }, { status: 500 });
  }
}
