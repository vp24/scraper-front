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

    try {
      const response = await axios.get(`http://localhost:3000/search?ticker=${ticker}`);
      const sanitizedHTML = DOMPurify.sanitize(response.data.valuationSectionHTML);

      // Parse the sanitized HTML into a document object
      const parser = new DOMParser();
      const doc = parser.parseFromString(sanitizedHTML, 'text/html');

      // Select the element with class "card-title"
      const cardTitle = doc.querySelector('.card-title').textContent;

      // Select all the <tr> elements within the <thead> and <tbody>
      const theadTrElements = doc.querySelectorAll('thead tr');
      const tbodyTrElements = doc.querySelectorAll('tbody tr');

      // Extract the header row
      const headerRow = Array.from(theadTrElements[0].querySelectorAll('th')).map(th => th.textContent.trim());

      // Extract the data from each <tr> element in <tbody> and store it in separate arrays
      const tableData = {};
      tbodyTrElements.forEach(tr => {
        const tdElements = tr.querySelectorAll('td');
        const rowTitle = tdElements[0].textContent.trim();
        const rowData = Array.from(tdElements).slice(1).map(td => {
          const cellValue = td.textContent.trim();
          return cellValue === '-' ? null : cellValue;
        });
        tableData[rowTitle] = rowData;
      });

      // Select the <div> element with class "pr-10" and extract its text content
      const footnotes = doc.querySelector('div.pr-10').textContent.trim();

      // Process the tableData for cleaning 
      const cleanTableData = processData(tableData); 

      setData({
        html: sanitizedHTML,
        link: response.data.link,
        cardTitle,
        headerRow,
        tableData: cleanTableData, // Use the cleaned data here
        footnotes,
      });
    } catch (error) {
      setError(error.response.data);
    }

    setLoading(false);
  };

  // Data cleaning function (modified to remove ONLY newlines)
  function processData(data) {
    const formattedData = {};
    for (const key in data) {
      formattedData[key] = data[key].map(value => {
        if (value !== null) {
          // Remove "\n" only
          return value.replace(/\n/g, ""); 
        }
        return value; // Keep null values as they are
      });
    }
    return formattedData;
  }

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
          <h3>Card Title:</h3>
          <p>{data.cardTitle}</p>
          <h3>Footnotes:</h3>
          <p>{data.footnotes}</p>
          <h3>Header Row:</h3>
          <p>{JSON.stringify(data.headerRow)}</p>

          {/* Existing display */}
          <h3>Table Data:</h3>
          {Object.entries(data.tableData).map(([rowTitle, rowData], index) => (
            <div key={index}>
              <p>{rowTitle} = {JSON.stringify(rowData)}</p>
            </div>
          ))}

          {/* New Table Display */}
          <h3>Table Data (Table Format):</h3>
          <table>
            <thead>
              <tr>
                {data.headerRow.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
<tbody>
  {Object.entries(data.tableData).map(([rowTitle, rowData], index) => (
    <tr key={index}>
      <td>{rowTitle}</td>
      {rowData.map((value, colIndex) => (
        <td key={colIndex}>{value === null ? '-' : value}</td>
      ))}
    </tr>
  ))}
</tbody>

          </table>
        </div>
      )}
    </div>
  );
};

export default App;
