import React from 'react';
import './SummaryStats.css';

function SummaryStats({ summary, sessionId }) {
  if (!summary) return null;

  const stats = [
    {
      label: 'Total Sites',
      value: summary.total_sites,
      icon: '🏢',
      color: '#667eea',
    },
    {
      label: 'Sites Needing Resupply',
      value: summary.sites_needing_resupply,
      icon: '📦',
      color: '#f59e0b',
    },
    {
      label: 'Total Quantity',
      value: summary.total_quantity.toLocaleString(),
      icon: '📊',
      color: '#10b981',
    },
    {
      label: 'Avg Projected Demand',
      value: summary.avg_projected_demand.toFixed(1),
      icon: '📈',
      color: '#3b82f6',
    },
    {
      label: 'Avg Processing Time',
      value: `${summary.avg_latency_ms.toFixed(0)}ms`,
      icon: '⚡',
      color: '#8b5cf6',
    },
  ];

  // Add new analysis stats if available
  if (summary.waste_analysis) {
    stats.push({
      label: 'Total Waste',
      value: summary.waste_analysis.total_waste || 0,
      icon: '🗑️',
      color: '#ef4444',
    });
  }

  if (summary.temp_excursions) {
    stats.push({
      label: 'Temp Excursions',
      value: summary.temp_excursions.total_excursions || 0,
      icon: '🌡️',
      color: '#f97316',
    });
  }

  if (summary.depot_optimization) {
    stats.push({
      label: 'Depot Optimization Score',
      value: `${summary.depot_optimization.optimization_score.toFixed(1)}%`,
      icon: '🏭',
      color: '#06b6d4',
    });
  }

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h3>Summary Statistics</h3>
        {sessionId && (
          <div className="session-id">
            Session: <span>{sessionId}</span>
          </div>
        )}
      </div>
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SummaryStats;

