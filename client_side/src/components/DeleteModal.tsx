import "../styles/DeleteModal.css";

interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

export default function DeleteModal({
  open,
  onClose,
  onConfirm,
  message,
}: DeleteModalProps) {
  if (!open) return null;

  return (
    <div className="delete-overlay">
      <div className="delete-box">
        <h3>Confirm Delete</h3>
        <p>{message}</p>

        <div className="delete-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="delete-btn" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
