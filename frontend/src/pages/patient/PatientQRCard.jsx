import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const PatientQRCard = ({
  patient,
  profile,
  user,
  qrCodeDataUrl: qrProp,
  qrLoading = false,
  qrError = null,
  onRetry
}) => {
  const cardRef = useRef(null);

  const patientName = user?.name || patient?.userId?.name || patient?.name || 'Patient';
  const patientCode = profile?.patientCode || patient?.patientCode || 'PAT-PENDING';
  const bloodGroup = profile?.bloodGroup || patient?.bloodGroup || 'Unknown';
  const gender = profile?.gender || patient?.gender || 'N/A';
  const emergencyContact = profile?.emergencyContact || patient?.emergencyContact || {};
  const currentQrCode = qrProp || profile?.qrCodeDataUrl || patient?.qrCodeDataUrl;
  const baseUrl = (import.meta.env.VITE_FRONTEND_URL && import.meta.env.VITE_FRONTEND_URL.trim())
    ? import.meta.env.VITE_FRONTEND_URL.trim().replace(/\/$/, '')
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const verificationUrl = `${baseUrl}/verify-patient?code=${encodeURIComponent(patientCode)}`;

  // Printable ID Card handler
  const handlePrint = () => {
    window.print();
  };

  // Download QR Code image
  const handleDownloadQR = () => {
    // If backend generated a base64 png data URL, download it directly
    if (currentQrCode && currentQrCode.startsWith('data:image/')) {
      const link = document.createElement('a');
      link.href = currentQrCode;
      link.download = `${patientCode}_Identification_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Fallback using SVG conversion to PNG
    const svg = document.getElementById('patient-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width || 320;
      canvas.height = img.height || 320;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${patientCode}_Identification_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div>
      {/* Error state alert if QR fetch failed */}
      {qrError && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between mb-3 shadow-sm rounded-3">
          <div>
            <i className="bi bi-exclamation-triangle-fill me-2 text-warning"></i>
            <span>{qrError}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              className="btn btn-sm btn-outline-dark"
              onClick={onRetry}
              disabled={qrLoading}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              {qrLoading ? 'Retrying...' : 'Retry'}
            </button>
          )}
        </div>
      )}

      {/* Physical / Digital Patient Identification Card */}
      <div
        ref={cardRef}
        className="card-healthcare p-4 border bg-white shadow-sm mb-4"
        style={{ maxWidth: '580px', margin: '0 auto', borderRadius: '16px' }}
        id="printable-patient-card"
      >
        {/* Card Header */}
        <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3 bg-navy text-white p-3 rounded-3">
          <div className="d-flex align-items-center gap-2">
            <div
              className="bg-teal text-white rounded-2 d-flex align-items-center justify-content-center"
              style={{ width: '36px', height: '36px' }}
            >
              <i className="bi bi-hospital-fill fs-5"></i>
            </div>
            <div>
              <div className="fw-bold fs-6 lh-1">St. Jude Medical</div>
              <small className="text-light" style={{ fontSize: '0.7rem', opacity: 0.85 }}>
                PATIENT IDENTIFICATION CARD
              </small>
            </div>
          </div>
          <span className="badge bg-teal text-white px-2 py-1 small">OFFICIAL ID</span>
        </div>

        {/* Card Body */}
        <div className="row align-items-center g-3">
          {/* QR Code Container */}
          <div className="col-sm-5 text-center">
            <div
              className="p-2 border rounded-3 bg-light d-inline-block shadow-sm"
              style={{ minWidth: '176px', minHeight: '176px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {qrLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-teal mb-2" role="status">
                    <span className="visually-hidden">Loading QR...</span>
                  </div>
                  <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                    Generating QR...
                  </div>
                </div>
              ) : currentQrCode ? (
                <img
                  src={currentQrCode}
                  alt={`QR Code for ${patientCode}`}
                  className="img-fluid rounded"
                  style={{ width: '160px', height: '160px' }}
                />
              ) : (
                <QRCodeSVG
                  id="patient-qr-svg"
                  value={verificationUrl}
                  size={160}
                  level="H"
                  fgColor="#0a2540"
                  bgColor="#ffffff"
                />
              )}
            </div>
            <div className="mt-2">
              <span className="badge bg-light text-navy border fw-bold px-2 py-1">
                {patientCode}
              </span>
            </div>
          </div>

          {/* Patient Demographic Details */}
          <div className="col-sm-7">
            <h5 className="fw-bold text-navy mb-1">{patientName}</h5>
            <div className="small text-muted mb-3">
              <i className="bi bi-envelope me-1"></i> {user?.email || 'N/A'}
            </div>

            <div className="row g-2 small text-muted">
              <div className="col-6">
                <span className="d-block text-secondary" style={{ fontSize: '0.75rem' }}>BLOOD GROUP</span>
                <strong className="text-danger fs-6">{bloodGroup}</strong>
              </div>
              <div className="col-6">
                <span className="d-block text-secondary" style={{ fontSize: '0.75rem' }}>GENDER</span>
                <strong className="text-navy text-capitalize">{gender}</strong>
              </div>
              <div className="col-12 border-top pt-2 mt-2">
                <span className="d-block text-secondary" style={{ fontSize: '0.75rem' }}>EMERGENCY CONTACT</span>
                <strong className="text-navy">
                  {emergencyContact?.name ? `${emergencyContact.name} (${emergencyContact.relation || 'Contact'})` : 'Not Specified'}
                </strong>
                {emergencyContact?.phone && (
                  <div className="text-muted small">{emergencyContact.phone}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Privacy Notice */}
        <div className="mt-3 pt-3 border-top text-center">
          <div className="small text-muted" style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
            <i className="bi bi-shield-check text-success me-1"></i>
            <strong>Privacy Guarantee:</strong> This QR code strictly encodes an opaque patient identifier. Protected Health Information (PHI) and clinical records are never stored inside this code.
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="d-flex justify-content-center gap-3 no-print">
        <button
          className="btn btn-hospital-teal px-3 py-2"
          onClick={handleDownloadQR}
          disabled={qrLoading || !patientCode}
        >
          <i className="bi bi-download me-2"></i> Download QR Image
        </button>
        <button
          className="btn btn-hospital-primary px-3 py-2"
          onClick={handlePrint}
          disabled={qrLoading || !patientCode}
        >
          <i className="bi bi-printer me-2"></i> Print Identification Card
        </button>
      </div>
    </div>
  );
};

export default PatientQRCard;
