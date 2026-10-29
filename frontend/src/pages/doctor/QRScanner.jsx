import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const extractPatientCode = (scannedText) => {
  if (!scannedText) return '';
  const match = scannedText.match(/(PAT-\d{4}-[A-Z0-9]+)/i);
  return match ? match[1].toUpperCase() : scannedText.trim().toUpperCase();
};

const QRScanner = ({ onScanSuccess, onClose }) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanMessage, setScanMessage] = useState(null);
  const scannerRef = useRef(null);
  const readerId = 'html5qr-code-full-region';

  useEffect(() => {
    let html5QrCode = null;

    const startScanner = async () => {
      try {
        setCameraError(null);
        html5QrCode = new Html5Qrcode(readerId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            // Success callback - extract opaque code whether QR contains URL or raw identifier
            const cleanCode = extractPatientCode(decodedText);
            setScanMessage(`Detected Patient ID: ${cleanCode}`);
            if (html5QrCode && html5QrCode.isScanning) {
              html5QrCode.stop().then(() => {
                setCameraActive(false);
                onScanSuccess(cleanCode);
              }).catch(() => {
                onScanSuccess(cleanCode);
              });
            } else {
              onScanSuccess(cleanCode);
            }
          },
          (errorMessage) => {
            // Ignore frame scan failures
          }
        );

        setCameraActive(true);
      } catch (err) {
        console.warn('Camera initialization error:', err);
        setCameraError('Unable to access device camera. Please check camera permissions, or use manual identifier input below.');
        setCameraActive(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err) => console.warn('Scanner stop error:', err));
      }
    };
  }, [onScanSuccess]);

  const handleStopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setCameraActive(false);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleStopCamera();
      const cleanCode = extractPatientCode(manualCode);
      onScanSuccess(cleanCode);
    }
  };

  const handleSampleClick = (code) => {
    const cleanCode = extractPatientCode(code);
    setManualCode(cleanCode);
    handleStopCamera();
    onScanSuccess(cleanCode);
  };

  return (
    <div className="card-healthcare p-4 bg-white border">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold text-navy mb-0">
          <i className="bi bi-qr-code-scan text-teal me-2"></i> Patient QR Scanner
        </h5>
        {onClose && (
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
        )}
      </div>

      <p className="text-muted small mb-3">
        Point the camera at the patient's official digital or printed identification card, or manually enter their opaque identifier.
      </p>

      {scanMessage && (
        <div className="alert alert-success py-2 small mb-3">
          <i className="bi bi-check-circle-fill me-1"></i> {scanMessage}
        </div>
      )}

      {cameraError && (
        <div className="alert alert-warning py-2 small mb-3">
          <i className="bi bi-camera-video-off-fill me-1"></i> {cameraError}
        </div>
      )}

      {/* Live Camera Viewport */}
      <div className="text-center mb-3">
        <div
          id={readerId}
          className="mx-auto rounded-3 overflow-hidden border bg-dark"
          style={{ width: '100%', maxWidth: '360px', minHeight: '260px' }}
        ></div>
        {cameraActive && (
          <div className="small text-muted mt-2">
            <span className="spinner-grow spinner-grow-sm text-danger me-1" role="status"></span>
            Camera feed active. Align QR code within the frame.
          </div>
        )}
      </div>

      {/* Manual Input Fallback */}
      <div className="border-top pt-3">
        <label className="form-label small fw-bold text-navy mb-1">
          Manual Patient Identifier Entry:
        </label>
        <form onSubmit={handleManualSubmit} className="input-group mb-2">
          <span className="input-group-text bg-white">
            <i className="bi bi-upc-scan text-teal"></i>
          </span>
          <input
            type="text"
            className="form-control form-control-hospital"
            placeholder="e.g., PAT-2026-A101"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <button type="submit" className="btn btn-hospital-primary px-3">
            Lookup EMR Chart
          </button>
        </form>

        {/* Quick Sample Clickers for Doctor Testing */}
        <div className="d-flex align-items-center gap-2 small text-muted">
          <span>Quick Test Identifiers:</span>
          <button
            type="button"
            className="btn btn-xs btn-outline-secondary py-0 px-2"
            style={{ fontSize: '0.75rem' }}
            onClick={() => handleSampleClick('PAT-2026-A101')}
          >
            PAT-2026-A101 (Johnathan)
          </button>
          <button
            type="button"
            className="btn btn-xs btn-outline-secondary py-0 px-2"
            style={{ fontSize: '0.75rem' }}
            onClick={() => handleSampleClick('PAT-2026-B202')}
          >
            PAT-2026-B202 (Emily)
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
