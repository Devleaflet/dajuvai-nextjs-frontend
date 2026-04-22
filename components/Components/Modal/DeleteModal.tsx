
import React, { useEffect } from "react";
import "@/styles/DeleteModal.css";

interface DeleteModalProps {
  show: boolean;
  onClose: () => void;
  onDelete: () => void;
  productName: string;
  title?: string;
  description?: string;
  isDeleting?: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  show,
  onClose,
  onDelete,
  productName,
  title = "Delete Item",
  description = "This action cannot be undone.",
  isDeleting = false,
}) => {
  useEffect(() => {
    if (!show) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [show, onClose, isDeleting]);

  if (!show) return null;

  return (
    <div className="delete-confirm-modal">
      <div
        className="delete-confirm-modal__overlay"
        onClick={isDeleting ? undefined : onClose}
      ></div>
      <div
        className="delete-confirm-modal__content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <div className="delete-confirm-modal__icon" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 3H15M4 7H20M6 7L7 19C7.1 20.1 8 21 9.1 21H14.9C16 21 16.9 20.1 17 19L18 7M10 11V17M14 11V17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 id="delete-modal-title" className="delete-confirm-modal__title">
          {title}
        </h3>
        <p className="delete-confirm-modal__message">
          Are you sure you want to delete{" "}
          <strong>"{productName}"</strong>?
        </p>
        <p className="delete-confirm-modal__description">{description}</p>
        <div className="delete-confirm-modal__actions">
          <button
            className="delete-confirm-modal__cancel-btn"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="delete-confirm-modal__delete-btn"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
