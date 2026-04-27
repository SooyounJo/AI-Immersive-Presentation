import type { AppMode } from '../../stores/presentationStore';
import { usePlayback } from '../../hooks/usePlayback';
import { usePresentationStore } from '../../stores/presentationStore';
import { useState } from 'react';
import { IconClose } from '../icons';

export function TopBar({
  visible,
  projectName,
  appMode,
  onLeave,
}: {
  visible: boolean;
  projectName?: string;
  appMode: AppMode;
  onLeave: () => void;
}) {
  const { play, pause } = usePlayback();
  const { setAppMode } = usePresentationStore();
  const [shareOpen, setShareOpen] = useState(false);

  const handleViewClick = () => {
    if (appMode === 'design') {
      void play();
    } else {
      setAppMode('design');
      pause();
    }
  };

  return (
    <>
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{
          borderBottom: 'none',
          background: 'rgba(6, 8, 12, 0.98)',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          transform: visible ? 'translateY(0)' : 'translateY(-110%)',
          opacity: visible ? 1 : 0,
          transition: 'transform 400ms var(--gen-ease), opacity 400ms var(--gen-ease)',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <div className="flex items-center gap-6">
          <span
            style={{
              fontSize: 20,
              fontWeight: 200,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#f5f7ff',
              cursor: 'pointer',
            }}
            onClick={onLeave}
          >
            VOIX
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 0,
              color: 'rgba(255,255,255,0.4)',
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
              {projectName || 'MY FIRST PROJECT'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleViewClick}
            style={{
              padding: '8px 24px',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: appMode === 'present' ? '#ffffff' : 'transparent',
              color: appMode === 'present' ? '#000000' : '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
            }}
          >
            {appMode === 'present' ? 'Design' : 'View'}
          </button>
          <button
            onClick={() => setShareOpen(true)}
            style={{
              padding: '8px 24px',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
            }}
          >
            Share
          </button>
          <button
            onClick={onLeave}
            style={{
              padding: '8px 24px',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
            }}
          >
            And
          </button>
        </div>
      </div>

      {shareOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShareOpen(false)}
        >
          <div
            style={{
              background: 'var(--gen-white)',
              color: 'var(--gen-text)',
              width: 400,
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 style={{ fontSize: 16, fontWeight: 500, letterSpacing: '0.04em' }}>Share Presentation</h2>
              <button
                onClick={() => setShareOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gen-text-mute)' }}
              >
                <IconClose size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label style={{ display: 'block', fontSize: 11, marginBottom: 8, color: 'var(--gen-text-sub)' }}>
                Invite by Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="gen-input flex-1"
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--gen-border)',
                    borderRadius: 4,
                    background: 'transparent',
                    color: 'var(--gen-text)',
                  }}
                />
                <button
                  style={{
                    padding: '0 16px',
                    background: 'var(--gen-black)',
                    color: 'var(--gen-white)',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                  onClick={() => {
                    alert('Invitation sent (Mock)');
                    setShareOpen(false);
                  }}
                >
                  Send
                </button>
              </div>
            </div>

            <div style={{ margin: '24px 0', height: 1, background: 'var(--gen-border)' }} />

            <div>
              <label style={{ display: 'block', fontSize: 11, marginBottom: 8, color: 'var(--gen-text-sub)' }}>
                Anyone with the link
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  readOnly
                  value="https://voix.hyundai.com/p/mock-link-123"
                  className="flex-1"
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--gen-border)',
                    borderRadius: 4,
                    background: 'var(--gen-bg-gray)',
                    color: 'var(--gen-text)',
                    fontSize: 12,
                  }}
                />
                <button
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    color: 'var(--gen-text)',
                    border: '1px solid var(--gen-border)',
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => {
                    alert('Link copied to clipboard (Mock)');
                  }}
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
