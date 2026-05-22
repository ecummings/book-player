'use client';
import { useState } from 'react';
import { UserProfile } from '@/lib/types';
import { DEMO_USERS } from '@/lib/demoUsers';
import { setCurrentUser } from '@/lib/storage';

interface Props {
  onLogin: (user: UserProfile) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const teachers = DEMO_USERS.filter(u => u.role === 'teacher');
  const students  = DEMO_USERS.filter(u => u.role === 'student');

  const handleSelect = (user: UserProfile) => {
    setCurrentUser(user);
    onLogin(user);
  };

  const cardStyle = (id: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.25rem',
    borderRadius: '12px',
    border: `2px solid ${hovered === id ? '#2563eb' : '#e2e8f0'}`,
    backgroundColor: hovered === id ? '#eff6ff' : '#ffffff',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background-color 0.15s',
    textAlign: 'left',
  });

  const section = (title: string, users: UserProfile[]) => (
    <section>
      <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280' }}>
        {title}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.625rem' }}>
        {users.map(user => (
          <button
            key={user.id}
            onClick={() => handleSelect(user)}
            onMouseEnter={() => setHovered(user.id)}
            onMouseLeave={() => setHovered(null)}
            style={cardStyle(user.id)}
          >
            <span style={{ fontSize: '2rem', flexShrink: 0 }}>{user.avatar}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1a1a1a' }}>{user.name}</div>
              <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.125rem' }}>
                {user.role === 'teacher' ? user.class_name : `Grade ${user.grade_band}`}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '680px' }}>
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📚</div>
          <h1 style={{ margin: '0 0 0.375rem', fontSize: '2rem', fontWeight: 800, color: '#1a1a1a' }}>Book Player</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '1rem' }}>K–6 Digital Reading · Select a profile to continue</p>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {section('Teachers', teachers)}
          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: 0 }} />
          {section('Students', students)}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', color: '#9ca3af', fontSize: '0.8125rem' }}>
          Demo mode — no passwords required
        </p>
      </div>
    </div>
  );
}
