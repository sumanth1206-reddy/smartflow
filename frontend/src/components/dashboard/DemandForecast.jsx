import React from "react";
import Card from "../common/Card";

export default function DemandForecast({ forecastData, recommendations = [] }) {
  const percentage = forecastData?.percentage || '0%';
  const direction = forecastData?.direction === 'increase' ? '📈' : '📉';
  const message = forecastData?.message || 'Stable demand patterns detected.';

  return (
    <Card
      title="Demand Forecast"
      subtitle="Next 7 Days Prediction"
      className="panel-card"
    >
      <div className="forecast-box">
        <h2>{direction} {percentage}</h2>
        <p>{message}</p>
        
        {recommendations.length > 0 ? (
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--accent)' }}>
              💡 AI-Suggested Orders:
            </strong>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recommendations.slice(0, 3).map((rec, idx) => (
                <li key={idx} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(148, 163, 184, 0.05)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <div>
                    <strong>{rec.name}</strong> 
                    <small style={{ display: 'block', color: 'var(--muted)' }}>{rec.reason}</small>
                  </div>
                  <span style={{ color: 'var(--success)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    +{rec.suggested_order} units
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <small style={{ display: 'block', marginTop: '12px', color: 'var(--muted)' }}>
            All inventory levels are predicted to remain healthy.
          </small>
        )}
      </div>
    </Card>
  );
}