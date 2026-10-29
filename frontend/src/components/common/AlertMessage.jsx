import React from 'react';

const AlertMessage = ({ type = 'danger', message, onClose }) => {
  if (!message) return null;

  const iconClass =
    type === 'danger'
      ? 'bi-exclamation-triangle-fill'
      : type === 'success'
      ? 'bi-check-circle-fill'
      : type === 'warning'
      ? 'bi-exclamation-circle-fill'
      : 'bi-info-circle-fill';

  return (
    <div
      className={`alert alert-${type} d-flex align-items-center justify-content-between shadow-sm border-0 rounded-3 mb-4`}
      role="alert"
    >
      <div className="d-flex align-items-center">
        <i className={`bi ${iconClass} me-2 fs-5`}></i>
        <div>{message}</div>
      </div>
      {onClose && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onClose}
        ></button>
      )}
    </div>
  );
};

export default AlertMessage;
