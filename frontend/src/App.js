import React, { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import ResultsDisplay from './components/ResultsDisplay';
import SummaryStats from './components/SummaryStats';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async (formData) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/upload-and-run', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process files');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'An error occurred while processing your files');
    } finally {
      setLoading(false);
    }
  };

  const handleRunDefault = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/run-default', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to run with default data');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'An error occurred while processing default data');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1 className="title">
            <span className="title-icon">🏥</span>
            Clinical Supply Copilot
          </h1>
          <p className="subtitle">
            Intelligent forecasting and resupply recommendations for clinical trials
          </p>
        </header>

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button className="error-close" onClick={() => setError(null)}>
              ×
            </button>
          </div>
        )}

        {!results && !loading && (
          <FileUpload
            onUpload={handleUpload}
            onRunDefault={handleRunDefault}
          />
        )}

        {loading && <LoadingSpinner />}

        {results && (
          <div className="results-container">
            <div className="results-header">
              <h2>Forecasting Results</h2>
              <button className="reset-button" onClick={handleReset}>
                New Analysis
              </button>
            </div>

            <SummaryStats summary={results.summary} sessionId={results.session_id} />

            <ResultsDisplay results={results.results} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

