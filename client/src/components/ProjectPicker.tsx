import { useEffect, useState } from 'react';
import { useProjectsStore, type Project } from '../stores/projectsStore';
import { usePresentationStore } from '../stores/presentationStore';
import { IconPlus, IconTrash, IconArrowRight } from './icons';
import { Particles } from './Particles';

export function ProjectPicker() {
  const { projects, create, enter, rename, remove, init } = useProjectsStore();
  const { setAppMode } = usePresentationStore();
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [creating, setCreating] = useState(false);
  const [isCreateHovered, setIsCreateHovered] = useState(false);

  useEffect(() => { init(); }, [init]);

  const handleCreate = async (name: string) => {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const p = await create(name.trim());
      setNewName('');
      setAppMode('design');
      enter(p.id);
    } finally {
      setCreating(false);
    }
  };

  const startRename = (p: Project) => {
    setRenamingId(p.id);
    setRenameValue(p.name);
  };

  const submitRename = async () => {
    if (renamingId && renameValue.trim()) {
      await rename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden relative"
      style={{ background: '#050509', color: '#ffffff' }}
    >
      {/* Cosmic starfield background */}
      <Particles
        particleColors={['#ffffff']}
        particleCount={360}
        particleSpread={10}
        speed={0.045}
        particleBaseSize={100}
        moveParticlesOnHover
        alphaParticles={false}
        disableRotation={false}
        pixelRatio={1}
      />

      {/* Top bar — VOIX brand mark */}
      <div
        className="flex items-center justify-between px-10 py-7 relative"
        style={{ zIndex: 1 }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 200,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: '#ffffff',
          }}
        >
          VOIX
        </span>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-hidden relative" style={{ zIndex: 1 }}>
        <div className="max-w-2xl mx-auto px-10 pt-12 pb-10">
          {/* Heading */}
          <div className="mb-12">
            <div
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
                marginBottom: 18,
              }}
            >
              AI-Immersive Presentation
            </div>
            <h1
              style={{
                fontSize: 46,
                fontWeight: 200,
                letterSpacing: '-0.01em',
                lineHeight: 1.3,
                marginBottom: 14,
                color: '#ffffff',
              }}
            >
              Create your interactive<br />presentation with AI
            </h1>
          </div>

          {/* Create new */}
          <div className="mb-12">
            <FieldLabel>New Project</FieldLabel>
            <form
              onSubmit={(e) => { e.preventDefault(); handleCreate(newName); }}
              className="flex"
              style={{
                border: '1px solid rgba(255,255,255,0.28)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))',
                backdropFilter: 'blur(14px)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.28)',
              }}
            >
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Project name"
                autoFocus
                style={{
                  flex: 1,
                  padding: '13px 16px',
                  border: 'none',
                  fontSize: 14,
                  fontFamily: 'var(--gen-font-body)',
                  background: 'transparent',
                  outline: 'none',
                  color: '#ffffff',
                }}
              />
              <button
                type="submit"
                disabled={!newName.trim() || creating}
                onMouseEnter={() => setIsCreateHovered(true)}
                onMouseLeave={() => setIsCreateHovered(false)}
                style={{
                  padding: '0 20px',
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  background: isCreateHovered && newName.trim() && !creating
                    ? 'rgba(255,255,255,0.36)'
                    : 'rgba(255,255,255,0.26)',
                  color: '#ffffff',
                  border: isCreateHovered && newName.trim() && !creating
                    ? '1px solid rgba(255,255,255,0.55)'
                    : '1px solid rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: !newName.trim() || creating ? 0.45 : 1,
                  transition: 'opacity var(--gen-fast), background var(--gen-fast), border-color var(--gen-fast), box-shadow var(--gen-fast)',
                  boxShadow: isCreateHovered && newName.trim() && !creating
                    ? 'inset 0 0 0 1px rgba(255,255,255,0.18), 0 0 14px rgba(255,255,255,0.14)'
                    : 'none',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <IconPlus size={12} />
                Create
              </button>
            </form>
          </div>

          {/* List */}
          <div>
            <FieldLabel>Recent</FieldLabel>
            {projects.length === 0 ? (
              <div
                style={{
                  padding: '28px 20px',
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.03)',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: 12,
                  lineHeight: 1.7,
                  backdropFilter: 'blur(6px)',
                }}
              >
                No projects yet. Create your first one above.
              </div>
            ) : (
              <div
                className="no-scrollbar"
                style={{
                  border: '1px solid rgba(255,255,255,0.22)',
                  background: 'linear-gradient(140deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 16px 36px rgba(0,0,0,0.22)',
                  maxHeight: 'calc(100vh - 420px)',
                  overflowY: 'auto',
                }}
              >
                {projects.map((p, i) => (
                  <div
                    key={p.id}
                    className="group"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '16px 18px',
                      borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.12)',
                      cursor: 'pointer',
                      transition: 'background var(--gen-fast)',
                    }}
                    onClick={() => {
                      if (!renamingId) {
                        setAppMode('design');
                        enter(p.id);
                      }
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: '0.14em',
                        color: 'rgba(255,255,255,0.5)',
                        width: 28,
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {renamingId === p.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitRename();
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          onBlur={submitRename}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '100%',
                            padding: '3px 0',
                            border: 'none',
                            borderBottom: '1px solid rgba(255,255,255,0.8)',
                            fontSize: 15,
                            fontFamily: 'var(--gen-font-body)',
                            background: 'transparent',
                            outline: 'none',
                            color: '#ffffff',
                          }}
                        />
                      ) : (
                        <>
                          <div
                            onDoubleClick={(e) => { e.stopPropagation(); startRename(p); }}
                            style={{ fontSize: 15, fontWeight: 400, letterSpacing: '0.01em', color: '#ffffff' }}
                            className="truncate"
                          >
                            {p.name}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: 'rgba(255,255,255,0.45)',
                              letterSpacing: '0.1em',
                              marginTop: 2,
                            }}
                          >
                            {timeAgo(p.updatedAt)}
                          </div>
                        </>
                      )}
                    </div>

                    <div
                      className="opacity-0 group-hover:opacity-100"
                      style={{ display: 'flex', gap: 8, transition: 'opacity var(--gen-fast)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => startRename(p)}
                        style={{
                          padding: '5px 9px',
                          fontSize: 9,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          background: 'rgba(255,255,255,0.12)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          color: 'rgba(255,255,255,0.9)',
                          cursor: 'pointer',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        Rename
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete "${p.name}"? This cannot be undone.`)) {
                            await remove(p.id);
                          }
                        }}
                        style={{
                          padding: '5px 9px',
                          background: 'rgba(255,255,255,0.12)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          color: 'rgba(255,255,255,0.9)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          backdropFilter: 'blur(8px)',
                        }}
                        title="Delete"
                      >
                        <IconTrash size={11} />
                      </button>
                    </div>

                    <IconArrowRight
                      size={14}
                      style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.55)',
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}
