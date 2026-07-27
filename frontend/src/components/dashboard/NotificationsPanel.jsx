import React, { useEffect, useState } from "react";
import Card from "../common/Card";
import api from "../../services/api";

export default function NotificationsPanel(){
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await api.get('/notifications');
        setNotifications(response.data);
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    }
    fetchNotifications();
  }, []);

  function getIcon(type) {
    if (type?.toUpperCase() === 'WARNING') return '⚠';
    if (type?.toUpperCase() === 'SALE' || type?.toUpperCase() === 'INVOICE') return '🧾';
    if (type?.toUpperCase() === 'INVENTORY') return '📦';
    if (type?.toUpperCase() === 'AI') return '🤖';
    return '🔔';
  }

  return (
    <Card
      title="Notifications"
      subtitle="Latest alerts"
      className="panel-card"
    >
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center', padding: '16px 0' }}>
            No new notifications.
          </div>
        ) : (
          notifications.map((item, index) => (
            <div key={item.id || index} className="notification-item">
              <span>{getIcon(item.type)}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}