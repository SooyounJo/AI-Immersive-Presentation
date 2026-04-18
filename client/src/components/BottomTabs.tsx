import { usePresentationStore, type AppMode } from '../stores/presentationStore';
import { IconPlay, IconSettings } from './icons';

export function BottomTabs() {
  const { appMode, setAppMode } = usePresentationStore();

  const tabs: { id: AppMode; label: string; icon: React.ReactNode }[] = [
    { id: 'present', label: 'View', icon: <IconPlay size={12} /> },
    { id: 'design', label: 'Design', icon: <IconSettings size={12} /> },
  ];

  return (
    <div
      className="flex"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid var(--gen-border)',
      }}
    >
      {tabs.map((tab) => {
        const active = appMode === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setAppMode(tab.id)}
            className="flex-1 relative flex items-center justify-center gap-2"
            style={{
              padding: '18px 24px',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: active ? 'var(--gen-text)' : 'var(--gen-text-mute)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color var(--gen-fast)',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {active && (
              <span
                className="absolute"
                style={{
                  left: '50%',
                  top: 0,
                  transform: 'translateX(-50%)',
                  width: 32,
                  height: 1,
                  background: 'var(--gen-black)',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
