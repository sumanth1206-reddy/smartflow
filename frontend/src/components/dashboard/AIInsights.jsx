import React from "react";
import Card from "../common/Card";

export default function AIInsights({ insights = [] }) {
  const activeInsights = insights.length > 0 ? insights : [
    {
      title: "Demand scan in progress",
      value: "Analyzing...",
      color: "var(--muted)",
    }
  ];

  return (
    <Card
      title="🤖 AI Insights"
      subtitle="Smart recommendations based on inventory"
      className="panel-card"
    >
      <div className="ai-insights">
        {activeInsights.map((item, idx) => (
          <div className="ai-item" key={idx}>
            <div>
              <strong>{item.title}</strong>
              <p style={{ color: item.color, fontWeight: '700', fontSize: '1.1rem', marginTop: '4px' }}>
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}