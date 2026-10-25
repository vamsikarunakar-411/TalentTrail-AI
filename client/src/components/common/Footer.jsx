import React from 'react';
import { ShieldCheck, BookOpen, Sparkles, UserCheck } from 'lucide-react';
import { t } from '../../i18n';

export default function Footer({ currentLanguage = 'en-US' }) {
  return (
    <footer style={{
      marginTop: 'auto',
      borderTop: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-surface)',
      padding: '1.25rem var(--space-6)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }}>
      <div style={{
        maxWidth: 'var(--container-max)',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={14} color="var(--lavender-600)" />
          <span>
            <strong>TalentTrail AI</strong> • {t('nav.subtitle', null, currentLanguage)}
          </span>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <span>{t('report.disclaimerTitle', null, currentLanguage)}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldCheck size={14} color="var(--emerald-600)" />
            Zero Secret Exposure (Backend Isolation)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <UserCheck size={14} color="var(--lavender-600)" />
            Local Voice Processing (No Audio Storage)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <BookOpen size={14} color="var(--lavender-600)" />
            {t('nav.rubrics', null, currentLanguage)}
          </span>
        </div>
      </div>
    </footer>
  );
}

