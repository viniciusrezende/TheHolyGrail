import React from 'react';

export default function PersistFoundToggle() {
  const [enabled, setEnabled] = React.useState(false);
  const [booted, setBooted] = React.useState(false);

  // Load once on mount
  React.useEffect(() => {
    const s = window.Main.getSettings();
    setEnabled(!!s.persistFoundOnDrop);
    setBooted(true);

    // live updates if settings change elsewhere
    const off = window.Main.on?.('updatedSettings', (s2: any) => {
      setEnabled(!!s2.persistFoundOnDrop);
    });

    // your `on` wrapper doesn't return an "off" fn, so nothing to cleanup
    // but keep the var above in case you later extend it to return a disposer.
  }, []);

  const onToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.checked;
    setEnabled(v); // optimistic UI
    window.Main.saveSetting('persistFoundOnDrop', v);
    // The main process will broadcast 'updatedSettings' which keeps everyone in sync
  };

  if (!booted) return null; // avoid flicker on first paint

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <input type="checkbox" checked={enabled} onChange={onToggle} />
      <div>
        <div style={{ fontWeight: 600 }}>Keep items marked as found after dropping</div>
        <div style={{ opacity: 0.7, fontSize: 12 }}>
          When enabled, items you’ve found before remain marked as found even if they’re not in your stash.
        </div>
      </div>
    </label>
  );
}
