"use client";

import { useState, useEffect } from "react";
import "./globals.css";

export default function NewsGenerator() {
  const [trends, setTrends] = useState([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  
  const [activeArticle, setActiveArticle] = useState(null);
  const [isGeneratingTarget, setIsGeneratingTarget] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    setIsLoadingTrends(true);
    try {
      const res = await fetch("/api/trending");
      const data = await res.json();
      if (data.trends) setTrends(data.trends);
    } catch (e) {
      console.error(e);
      alert("Failed to fetch Google Trends");
    } finally {
      setIsLoadingTrends(false);
    }
  };

  const generateFullArticle = async (trend) => {
    setIsGeneratingTarget(trend.title);
    setActiveArticle(null);
    setThumbnailUrl(null);
    try {
      // Step 1: Generate SEO Article
      const resText = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trend.title, context: trend.context })
      });
      const data = await resText.json();
      if (!resText.ok) throw new Error(data.error);
      
      setActiveArticle(data);

      // Step 2: Generate Thumbnail
      if (data.imagePrompt) {
        setThumbnailUrl("loading"); // Indicate loading state
        const resImg = await fetch("/api/generate-thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: data.imagePrompt })
        });
        const imgData = await resImg.json();
        if (resImg.ok && imgData.base64) {
          setThumbnailUrl(imgData.base64);
        } else {
          setThumbnailUrl("error");
          console.error(imgData.error);
        }
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setIsGeneratingTarget(null);
    }
  };

  const bulkGenerate = async () => {
    if (!confirm("Are you sure you want to bulk generate up to 20 articles? This may use API quota rapidly.")) return;
    for (let i = 0; i < trends.length; i++) {
       // A simple sequential bulk runner
       await generateFullArticle(trends[i]);
       // Wait a bit to prevent rate limits
       await new Promise(resolve => setTimeout(resolve, 5000));
    }
    alert("Bulk automation complete!");
  };

  return (
    <>
      <header className="header-banner">
        <h2>NewsPublisher AI Engine</h2>
        <button className="btn btn-outline" onClick={fetchTrends}>
          ↻ Refresh Trends
        </button>
      </header>

      <main className="dashboard">
        <aside className="panel">
          <button className="btn btn-bulk" onClick={bulkGenerate}>
            ⚡ Run Automated Bulk Setup
          </button>
          
          <h3 style={{ marginBottom: "1rem" }}>Trending Search Topics</h3>
          {isLoadingTrends ? (
            <p>Fetching latest trends...</p>
          ) : (
            trends.map((item, idx) => (
              <div key={idx} className="trend-card">
                <div className="trend-meta">
                  <span className="traffic-badge">{item.traffic} Searches</span>
                  <span>{item.region}</span>
                </div>
                <div className="trend-title">{item.title}</div>
                <p style={{ fontSize: "0.85rem", color: "#666" }}>
                  {item.context.substring(0, 100)}...
                </p>
                <button 
                  className="btn" 
                  style={{ marginTop: "0.5rem" }}
                  disabled={isGeneratingTarget === item.title}
                  onClick={() => generateFullArticle(item)}
                >
                  {isGeneratingTarget === item.title ? "Extracting & Writing..." : "Generate SEO Article"}
                </button>
              </div>
            ))
          )}
        </aside>

        <section className="panel" style={{ minHeight: "800px" }}>
          {isGeneratingTarget && !activeArticle && (
            <div style={{ padding: "4rem", textAlign: "center" }}>
              <h3>Researching & Writing: {isGeneratingTarget}</h3>
              <p style={{ color: "#666", marginTop: "1rem" }}>Querying Gemini 2.5 Flash for SEO content...</p>
            </div>
          )}

          {!isGeneratingTarget && !activeArticle && (
             <div style={{ padding: "4rem", textAlign: "center", color: "#999" }}>
                Select a topic on the left to generate an article, or run Bulk Automation.
             </div>
          )}

          {activeArticle && (
             <div className="article-preview">
                <h1>{activeArticle.seoHeading}</h1>
                <div className="article-meta">
                   {new Date().toLocaleDateString()} • AI Generated News • High CTR Optimized
                </div>

                {thumbnailUrl === "loading" ? (
                   <div className="article-img">Generating Thumbnail with Imagen 4...</div>
                ) : thumbnailUrl === "error" ? (
                   <div className="article-img">Thumbnail Gen Failed (Check Quota)</div>
                ) : thumbnailUrl ? (
                   <img src={thumbnailUrl} alt={activeArticle.imageAltText} className="article-img" />
                ) : null}

                <div className="article-body" dangerouslySetInnerHTML={{ __html: activeArticle.content }} />

                <div className="seo-data-box">
                  <strong>Metadata Engine Output:</strong><br/><br/>
                  <b>Title:</b> {activeArticle.seoTitle}<br/>
                  <b>Desc:</b> {activeArticle.metaDescription}<br/>
                  <b>Slug:</b> /{activeArticle.slug}<br/>
                  <b>Img Name:</b> {activeArticle.imageRename}<br/>
                  <b>Short Summary:</b> {activeArticle.shortSummary}
                </div>
             </div>
          )}
        </section>
      </main>
    </>
  );
}
