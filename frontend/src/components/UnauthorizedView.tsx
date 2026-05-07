import { ShieldOff } from 'lucide-react';
import { useI18n } from '../i18n';

interface UnauthorizedViewProps {
  onBack?: () => void;
}

export function UnauthorizedView({ onBack }: UnauthorizedViewProps) {
  const { t } = useI18n();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f8fc',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 24px -4px rgba(0,0,0,0.08)',
          padding: '48px 40px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fef2f2',
            marginBottom: '24px',
          }}
        >
          <ShieldOff style={{ width: 28, height: 28, color: '#dc2626' }} />
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
          {t('Access Denied')}
        </h1>

        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '8px' }}>
          {t('Authentication Successful, but you do not have permission to access this application.')}
        </p>
        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '32px' }}>
          {t('Please contact an Administrator to be added to the authorized users list.')}
        </p>

        <div
          style={{
            padding: '12px 16px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
            color: '#94a3b8',
            marginBottom: '32px',
          }}
        >
          {t('If you believe this is a mistake, ask your Strategy Office administrator to add your email address.')}
        </div>

        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 24px',
              background: '#15345c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('Back to Login')}
          </button>
        )}
      </div>
    </div>
  );
}
