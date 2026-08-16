import { useState } from "react";
import Companion from "./Companion";
import JournalEntry from "./JournalEntry";
import JournalEditor from "./JournalEditor";
import JournalCustomize from "./JournalCustomize";
import JournalFlipbook from "./JournalFlipbook";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { now } from "../utils/time";
import { JOURNAL_COVERS, JOURNAL_STICKER_PACKS, getEntryIcon, makeJournalId } from "../utils/journal";

function Journal({
  entries,
  customization,
  level,
  activeAvatar,
  companionMood,
  onBack,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onSetCustomization,
}) {
  const [editingEntry, setEditingEntry] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isFlipbookOpen, setIsFlipbookOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const cover = JOURNAL_COVERS.find((item) => item.id === customization.cover) ?? JOURNAL_COVERS[0];
  const stickerPack =
    JOURNAL_STICKER_PACKS.find((pack) => pack.id === customization.stickerPack) ?? JOURNAL_STICKER_PACKS[0];

  function openNewEntry() {
    setEditingEntry(null);
    setIsEditorOpen(true);
  }

  function openExistingEntry(entry) {
    setEditingEntry(entry);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setEditingEntry(null);
  }

  function handleSaveEntry(payload) {
    if (editingEntry) {
      const updates =
        editingEntry.type === "quest"
          ? { note: payload.note, photo: payload.photo, sticker: payload.sticker }
          : {
              note: payload.note,
              photo: payload.photo,
              sticker: payload.sticker,
              category: payload.category || null,
              date: payload.date,
              icon: getEntryIcon(payload.category, editingEntry.title),
            };
      onUpdateEntry(editingEntry.id, updates);
    } else {
      onAddEntry({
        id: makeJournalId(),
        type: "moment",
        title: null,
        category: payload.category || null,
        icon: getEntryIcon(payload.category, ""),
        note: payload.note,
        photo: payload.photo,
        sticker: payload.sticker,
        xpEarned: null,
        date: payload.date || now(),
      });
    }
    closeEditor();
  }

  function handleDeleteFromEditor() {
    if (!editingEntry) return;
    setConfirmDeleteId(editingEntry.id);
  }

  function confirmDelete() {
    if (confirmDeleteId) onDeleteEntry(confirmDeleteId);
    setConfirmDeleteId(null);
    closeEditor();
  }

  return (
    <section className={`journal journal-cover--${cover.id} journal-theme--${customization.theme}`}>
      <button type="button" className="pixel-btn journal-back-btn" onClick={onBack}>
        ← BACK TO GO HUMAN
      </button>

      <header className="journal-header">
        <div className="companion-stage journal-header-companion">
          <Companion avatar={activeAvatar} mood={companionMood} size="sm" />
        </div>
        <p className="eyebrow journal-header-eyebrow">
          {cover.emoji} YOUR JOURNAL
        </p>
        <p className="journal-tagline">Your little collection of real-life wins.</p>

        <button type="button" className="pixel-btn pixel-btn--primary journal-primary-cta" onClick={openNewEntry}>
          + ADD MOMENT
        </button>

        <div className="journal-header-actions">
          <button type="button" className="pixel-btn journal-customize-btn" onClick={() => setIsCustomizeOpen(true)}>
            🎨 CUSTOMIZE
          </button>
          <button type="button" className="pixel-btn journal-flipbook-btn" onClick={() => setIsFlipbookOpen(true)}>
            📖 FLIPBOOK
          </button>
        </div>
      </header>

      {entries.length === 0 ? (
        <div className="pixel-frame journal-empty-state">
          <div className="companion-stage journal-empty-companion">
            <Companion avatar={activeAvatar} mood="idle" size="md" />
          </div>
          <p className="journal-empty-title">No moments yet.</p>
          <p className="journal-empty-body">
            Go do something small.
            <br />
            We'll save it here.
          </p>
        </div>
      ) : (
        <div className="journal-grid">
          {entries.map((entry) => (
            <JournalEntry
              key={entry.id}
              entry={entry}
              frameId={customization.frame}
              onOpen={() => openExistingEntry(entry)}
            />
          ))}
        </div>
      )}

      {isEditorOpen && (
        <JournalEditor
          entry={editingEntry}
          stickerOptions={stickerPack.stickers}
          onSave={handleSaveEntry}
          onDelete={handleDeleteFromEditor}
          onClose={closeEditor}
        />
      )}

      {isCustomizeOpen && (
        <JournalCustomize
          isOpen={isCustomizeOpen}
          onClose={() => setIsCustomizeOpen(false)}
          customization={customization}
          level={level}
          onSelect={onSetCustomization}
        />
      )}

      {isFlipbookOpen && (
        <JournalFlipbook
          entries={entries}
          frameId={customization.frame}
          onClose={() => setIsFlipbookOpen(false)}
        />
      )}

      {confirmDeleteId && (
        <ConfirmDeleteModal count={1} onCancel={() => setConfirmDeleteId(null)} onConfirm={confirmDelete} />
      )}
    </section>
  );
}

export default Journal;