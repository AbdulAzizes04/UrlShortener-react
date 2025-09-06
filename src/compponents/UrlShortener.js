import React, { useState } from "react";
import { Log } from "../utils/logger";

function UrlShortener({ token }) {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");

  const handleShorten = async () => {
    if (!url) {
      await Log("frontend", "warn", "urlshortener", "Empty URL entered", token);
      return;
    }

    try {
      // For now, mock shortened URL
      const shortened = `http://short.ly/${Math.random().toString(36).substr(2, 6)}`;
      setShortUrl(shortened);

      await Log("frontend", "info", "urlshortener", `URL shortened: ${shortened}`, token);
    } catch (err) {
      await Log("frontend", "error", "urlshortener", err.message, token);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>URL Shortener</h2>
      <input
        type="text"
        placeholder="Enter URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ width: "300px", padding: "8px", marginRight: "10px" }}
      />
      <button onClick={handleShorten} style={{ padding: "8px 15px" }}>
        Shorten
      </button>

      {shortUrl && (
        <p style={{ marginTop: "20px" }}>
          Short URL: <a href={url} target="_blank" rel="noreferrer">{shortUrl}</a>
        </p>
      )}
    </div>
  );
}

export default UrlShortener;
