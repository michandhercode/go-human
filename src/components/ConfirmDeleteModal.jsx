function ConfirmDeleteModal({ count, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="pixel-frame modal" onClick={(event) => event.stopPropagation()}>
        <p className="modal-title">DELETE {count} MOMENT{count === 1 ? "" : "S"}?</p>
        <p className="modal-body">This can't be undone. Your XP stays exactly where it is.</p>

        <div className="modal-buttons">
          <button type="button" className="pixel-btn" onClick={onCancel}>
            CANCEL
          </button>
          <button type="button" className="pixel-btn pixel-btn--danger" onClick={onConfirm}>
            DELETE
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;
