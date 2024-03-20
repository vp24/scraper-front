// App.js
import React, { useState } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';

const App = () => {
  const [ticker, setTicker] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await axios.get(`http://localhost:3000/search?ticker=${ticker}`);
      const sanitizedHTML = DOMPurify.sanitize(response.data.valuationSectionHTML);
      setData({
        html: sanitizedHTML,
        link: response.data.link,
      });
    } catch (error) {
      setError(error.response.data);
    }

    setLoading(false);
  };

  return (
    <div>
      <h1>Stock Ticker Search</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter stock ticker"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {data && (
        <div>
          <h2>Scraped Data:</h2>
          <div dangerouslySetInnerHTML={{ __html: data.html }} />
          <p>
            Link: <a href={data.link} target="_blank" rel="noopener noreferrer">{data.link}</a>
          </p>
        </div>
      )}
    </div>
  );
};

export default App;