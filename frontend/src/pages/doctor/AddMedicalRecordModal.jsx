import React, { useState } from 'react';
import { medicalRecordAPI } from '../../api/client';
import AlertMessage from '../../components/common/AlertMessage';

const AddMedicalRecordModal = ({ patient, appointmentId, onRecordCreated, onCancel }) => {
  const [chiefComplaints, setChiefComplaints] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Vitals
  const [vitals, setVitals] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: ''
  });

  // Dynamic Prescriptions
  const [prescriptions, setPrescriptions] = useState([
    {
      medicineName: '',
      dosage: '',
      frequency: 'Once daily',
      duration: '5 days',
      instructions: 'Take after meals'
    }
  ]);

  // Dynamic Lab Tests
  const [labReports, setLabReports] = useState([]);

  const [followUpDate, setFollowUpDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVitalChange = (field, value) => {
    setVitals((prev) => ({ ...prev, [field]: value }));
  };

  // Prescription Handlers
  const handlePrescriptionChange = (index, field, value) => {
    const updated = [...prescriptions];
    updated[index][field] = value;
    setPrescriptions(updated);
  };

  const addPrescriptionRow = () => {
    setPrescriptions([
      ...prescriptions,
      {
        medicineName: '',
        dosage: '',
        frequency: 'Once daily',
        duration: '5 days',
        instructions: 'Take after meals'
      }
    ]);
  };

  const removePrescriptionRow = (index) => {
    setPrescriptions(prescriptions.filter((_, idx) => idx !== index));
  };

  // Lab Test Handlers
  const handleLabChange = (index, field, value) => {
    const updated = [...labReports];
    updated[index][field] = value;
    setLabReports(updated);
  };

  const addLabRow = () => {
    setLabReports([
      ...labReports,
      {
        testName: '',
        category: 'Clinical Biochemistry',
        status: 'completed',
        resultSummary: ''
      }
    ]);
  };

  const removeLabRow = (index) => {
    setLabReports(labReports.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!chiefComplaints.trim() || !diagnosis.trim()) {
      setError('Chief complaints and diagnosis are mandatory clinical fields.');
      return;
    }

    setLoading(true);

    try {
      // Filter out empty prescriptions
      const validPrescriptions = prescriptions.filter(
        (p) => p.medicineName.trim() && p.dosage.trim()
      );

      // Filter out empty labs
      const validLabs = labReports.filter((l) => l.testName.trim());

      const payload = {
        patientId: patient._id,
        appointmentId: appointmentId || null,
        chiefComplaints,
        diagnosis,
        clinicalNotes,
        vitalSigns: {
          bloodPressure: vitals.bloodPressure || '',
          heartRate: vitals.heartRate ? Number(vitals.heartRate) : null,
          temperature: vitals.temperature ? Number(vitals.temperature) : null,
          respiratoryRate: vitals.respiratoryRate ? Number(vitals.respiratoryRate) : null,
          oxygenSaturation: vitals.oxygenSaturation ? Number(vitals.oxygenSaturation) : null,
          weight: vitals.weight ? Number(vitals.weight) : null,
          height: vitals.height ? Number(vitals.height) : null
        },
        prescriptions: validPrescriptions,
        labReports: validLabs,
        followUpDate: followUpDate || null
      };

      const res = await medicalRecordAPI.createRecord(payload);
      if (res.data.success) {
        onRecordCreated(res.data.data);
      }
    } catch (err) {
      console.error('Failed to create medical record:', err);
      setError(err.message || 'Error documenting medical consultation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-healthcare p-4 p-md-5 bg-white border">
      <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
        <div>
          <span className="badge badge-dept mb-1">CLINICAL DOCUMENTATION</span>
          <h4 className="fw-bold text-navy mb-0">Record Medical Consultation & EMR</h4>
          <small className="text-muted">
            Documenting for: <strong>{patient?.userId?.name}</strong> (Code: {patient?.patientCode})
          </small>
        </div>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCancel}>
          <i className="bi bi-x-lg me-1"></i> Close
        </button>
      </div>

      {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}

      <form onSubmit={handleSubmit}>
        {/* 1. Clinical Diagnosis & Complaints */}
        <h6 className="fw-bold text-navy border-bottom pb-2 mb-3">
          <i className="bi bi-clipboard2-pulse-fill text-teal me-2"></i> 1. Clinical Evaluation
        </h6>
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <label className="form-label small fw-semibold text-navy">
              Chief Complaints <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control form-control-hospital"
              required
              value={chiefComplaints}
              onChange={(e) => setChiefComplaints(e.target.value)}
              placeholder="e.g., Shortness of breath, dizziness on standing"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label small fw-semibold text-navy">
              Primary Clinical Diagnosis <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control form-control-hospital"
              required
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g., Benign Positional Vertigo, Stage 1 HTN"
            />
          </div>
          <div className="col-12">
            <label className="form-label small fw-semibold text-navy">
              Examination Findings & Clinical Notes
            </label>
            <textarea
              rows="3"
              className="form-control form-control-hospital"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Detailed physical exam findings, patient history notes, diagnostic interpretation..."
            ></textarea>
          </div>
        </div>

        {/* 2. Vital Signs */}
        <h6 className="fw-bold text-navy border-bottom pb-2 mb-3">
          <i className="bi bi-activity text-teal me-2"></i> 2. Recorded Vital Signs
        </h6>
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <label className="form-label small text-muted">Blood Pressure</label>
            <input
              type="text"
              className="form-control form-control-hospital"
              placeholder="120/80"
              value={vitals.bloodPressure}
              onChange={(e) => handleVitalChange('bloodPressure', e.target.value)}
            />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label small text-muted">Heart Rate (bpm)</label>
            <input
              type="number"
              className="form-control form-control-hospital"
              placeholder="72"
              value={vitals.heartRate}
              onChange={(e) => handleVitalChange('heartRate', e.target.value)}
            />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted">Temp (°F)</label>
            <input
              type="number"
              step="0.1"
              className="form-control form-control-hospital"
              placeholder="98.6"
              value={vitals.temperature}
              onChange={(e) => handleVitalChange('temperature', e.target.value)}
            />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted">SpO2 (%)</label>
            <input
              type="number"
              className="form-control form-control-hospital"
              placeholder="99"
              value={vitals.oxygenSaturation}
              onChange={(e) => handleVitalChange('oxygenSaturation', e.target.value)}
            />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted">Weight (kg)</label>
            <input
              type="number"
              step="0.5"
              className="form-control form-control-hospital"
              placeholder="70"
              value={vitals.weight}
              onChange={(e) => handleVitalChange('weight', e.target.value)}
            />
          </div>
        </div>

        {/* 3. Prescriptions Table */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
          <h6 className="fw-bold text-navy mb-0">
            <i className="bi bi-prescription2 text-teal me-2"></i> 3. Prescribe Medications
          </h6>
          <button
            type="button"
            className="btn btn-xs btn-outline-primary py-1 px-2"
            onClick={addPrescriptionRow}
          >
            <i className="bi bi-plus-lg me-1"></i> Add Medication
          </button>
        </div>

        <div className="mb-4">
          {prescriptions.map((p, idx) => (
            <div key={idx} className="p-3 bg-light rounded-3 mb-2 border">
              <div className="row g-2 align-items-center">
                <div className="col-md-3">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Medicine Name (e.g., Amoxicillin)"
                    value={p.medicineName}
                    onChange={(e) => handlePrescriptionChange(idx, 'medicineName', e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Dosage (500mg)"
                    value={p.dosage}
                    onChange={(e) => handlePrescriptionChange(idx, 'dosage', e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Frequency (Twice daily)"
                    value={p.frequency}
                    onChange={(e) => handlePrescriptionChange(idx, 'frequency', e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Duration (7 days)"
                    value={p.duration}
                    onChange={(e) => handlePrescriptionChange(idx, 'duration', e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Instructions"
                    value={p.instructions}
                    onChange={(e) => handlePrescriptionChange(idx, 'instructions', e.target.value)}
                  />
                </div>
                <div className="col-md-1 text-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removePrescriptionRow(idx)}
                    disabled={prescriptions.length === 1}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 4. Lab Reports / Diagnostics */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
          <h6 className="fw-bold text-navy mb-0">
            <i className="bi bi-radioactive text-teal me-2"></i> 4. Diagnostic Lab Tests / Orders
          </h6>
          <button
            type="button"
            className="btn btn-xs btn-outline-primary py-1 px-2"
            onClick={addLabRow}
          >
            <i className="bi bi-plus-lg me-1"></i> Add Lab Test
          </button>
        </div>

        <div className="mb-4">
          {labReports.length === 0 ? (
            <small className="text-muted d-block">No lab tests ordered for this visit.</small>
          ) : (
            labReports.map((l, idx) => (
              <div key={idx} className="p-3 bg-light rounded-3 mb-2 border">
                <div className="row g-2 align-items-center">
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Test Name (e.g. Complete Blood Count)"
                      value={l.testName}
                      onChange={(e) => handleLabChange(idx, 'testName', e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Category (Hematology)"
                      value={l.category}
                      onChange={(e) => handleLabChange(idx, 'category', e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Findings / Results summary"
                      value={l.resultSummary}
                      onChange={(e) => handleLabChange(idx, 'resultSummary', e.target.value)}
                    />
                  </div>
                  <div className="col-md-1 text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeLabRow(idx)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 5. Follow-up */}
        <div className="mb-4">
          <label className="form-label small fw-semibold text-navy">Recommended Follow-up Date:</label>
          <input
            type="date"
            className="form-control form-control-hospital"
            style={{ maxWidth: '300px' }}
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
        </div>

        {/* Form Actions */}
        <div className="d-flex justify-content-end gap-3 pt-3 border-top">
          <button type="button" className="btn btn-outline-secondary px-4 py-2" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-hospital-primary px-4 py-2" disabled={loading}>
            {loading ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Documenting to EMR...
              </span>
            ) : (
              <span>
                <i className="bi bi-check2-circle me-1"></i> Save to Chronological EMR
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMedicalRecordModal;
