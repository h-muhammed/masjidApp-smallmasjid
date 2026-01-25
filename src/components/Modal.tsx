import React from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: Props) => {
  return (
    <div className={`modal ${isOpen ? "modal-open" : ""}`}>
      <div className="modal-box max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center sticky top-0 bg-base-100 z-10 pb-2 border-b">
          <h3 className="font-bold text-lg">{title}</h3>
          <button className="btn btn-sm btn-circle" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="py-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
