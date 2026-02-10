import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchesAPI } from '../api/client';

interface SentRequest {
  id: number;
  candidate: {
    id: number;
    name: string;
    headline?: string;
  };
  job: {
    id: number;
    title: string;
  };
  message?: string;
  sent_at: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  expires_at?: string;
}

const SentRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<SentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'>('all');

  useEffect(() => {
    fetchSentRequests();
  }, []);

  const fetchSentRequests = async () => {
    try {
      setLoading(true);
      const response = await matchesAPI.getSentRequests();
      setRequests(response.data || []);
    } catch (error) {
      console.error('Failed to fetch sent requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(req => req.status === filter);

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: '#fef3c7', text: '#92400e', label: '⏳ Pending' },
      ACCEPTED: { bg: '#d1fae5', text: '#065f46', label: '✅ Accepted' },
      DECLINED: { bg: '#fee2e2', text: '#991b1b', label: '✗ Declined' },
      EXPIRED: { bg: '#f3f4f6', text: '#4b5563', label: '⌛ Expired' }
    };

    const config = configs[status] || configs.PENDING;

    return (
      <span style={{
        backgroundColor: config.bg,
        color: config.text,
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 600
      }}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
        Loading sent requests...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => navigate('/company-dashboard')}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          ← Back to Dashboard
        </button>

        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
          Sent Invitations
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>
          Track candidates you've invited to apply
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '8px'
      }}>
        {['all', 'PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab as any)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: filter === tab ? '#8b5cf6' : 'transparent',
              color: filter === tab ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'all' ? 'All' : tab}
            {tab !== 'all' && (
              <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                ({requests.filter(r => r.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #d1d5db'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            No invitations sent yet
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Start reviewing candidates and send invitations to apply
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Header Row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '12px'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/company-dashboard/candidate/${request.candidate.id}`)}
                  >
                    {request.candidate.name}
                  </h3>
                  {request.candidate.headline && (
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                      {request.candidate.headline}
                    </p>
                  )}
                  <p style={{ fontSize: '14px', color: '#4b5563' }}>
                    For: <strong>{request.job.title}</strong>
                  </p>
                </div>
                {getStatusBadge(request.status)}
              </div>

              {/* Message */}
              {request.message && (
                <div style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '12px'
                }}>
                  <p style={{ fontSize: '13px', color: '#1e3a8a', fontStyle: 'italic', margin: 0 }}>
                    "{request.message}"
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div style={{
                display: 'flex',
                gap: '16px',
                fontSize: '13px',
                color: '#6b7280'
              }}>
                <span>Sent: {new Date(request.sent_at).toLocaleDateString()}</span>
                {request.expires_at && request.status === 'PENDING' && (
                  <span>
                    Expires: {new Date(request.expires_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentRequestsPage;
