import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Clock, ExternalLink, Inbox } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    if (notif.complaint_id) {
      navigate(`/complaints/${notif.complaint_id}`);
    }
  };

  return (
    <div className="py-2" style={{ maxWidth: '750px', margin: '0 auto' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="fs-4 fw-bold mb-1" style={{ color: '#19324D' }}>
            In-App Notifications
          </h1>
          <p className="text-muted small mb-0">
            Real-time status alerts and administrative updates regarding your filed complaints.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="btn-civic-secondary btn-sm d-flex align-items-center gap-1"
            onClick={markAllAsRead}
          >
            <CheckCheck size={16} /> Mark All as Read
          </button>
        )}
      </div>

      <div className="civic-card">
        <div className="civic-card-header">
          <span className="small fw-semibold text-dark">
            All Alerts ({notifications.length})
          </span>
          {unreadCount > 0 && (
            <span className="badge bg-danger text-white small">
              {unreadCount} Unread
            </span>
          )}
        </div>

        <div className="civic-card-body p-0">
          {notifications.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No notifications"
              description="You do not have any notification alerts at this time."
            />
          ) : (
            <div className="list-group list-group-flush">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`list-group-item list-group-item-action p-3 cursor-pointer d-flex align-items-start gap-3 ${
                    !notif.is_read ? 'bg-light font-weight-medium' : ''
                  }`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div
                    className="p-2 rounded-circle mt-1"
                    style={{
                      backgroundColor: notif.is_read ? '#F1F5F9' : '#DBEAFE',
                      color: notif.is_read ? '#68717C' : '#1E40AF'
                    }}
                  >
                    <Bell size={16} />
                  </div>

                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      {notif.reference_number && (
                        <span className="badge bg-secondary-subtle text-dark border small">
                          {notif.reference_number}
                        </span>
                      )}
                      <span className="text-muted small">
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-dark small mb-1">{notif.message}</div>

                    {notif.complaint_id && (
                      <span className="text-primary small d-inline-flex align-items-center gap-1">
                        View grievance details <ExternalLink size={12} />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
