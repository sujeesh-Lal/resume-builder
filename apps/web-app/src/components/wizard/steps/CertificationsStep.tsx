import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useResumeStore } from '../../../store/resume.store';
import { StepLayout } from '../StepLayout';
import type { Certification } from '@resume-platform/shared-types';

function CertificationForm({
  onSave,
  onCancel,
  initial,
}: {
  onSave: (data: Certification) => void;
  onCancel: () => void;
  initial?: Partial<Certification>;
}) {
  const { register, handleSubmit } = useForm<Certification>({ defaultValues: initial });

  const onSubmit = (data: Certification) => {
    onSave({ ...data, id: initial?.id ?? crypto.randomUUID() });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="form-label">Certification Name *</label>
          <input {...register('name', { required: true })} className="form-input" placeholder="AWS Certified Solutions Architect" />
        </div>
        <div>
          <label className="form-label">Issuing Organization *</label>
          <input {...register('issuer', { required: true })} className="form-input" placeholder="Amazon Web Services" />
        </div>
        <div>
          <label className="form-label">Issue Date *</label>
          <input {...register('date', { required: true })} type="month" className="form-input" />
        </div>
        <div>
          <label className="form-label">Expiry Date</label>
          <input {...register('expiryDate')} type="month" className="form-input" />
        </div>
        <div>
          <label className="form-label">Credential ID</label>
          <input {...register('credentialId')} className="form-input" placeholder="ABC-12345" />
        </div>
        <div className="sm:col-span-2">
          <label className="form-label">URL</label>
          <input {...register('url')} className="form-input" placeholder="https://..." />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">Save</button>
      </div>
    </form>
  );
}

export function CertificationsStep() {
  const { resume, addCertification, updateCertification, removeCertification } = useResumeStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <StepLayout title="Certifications" description="List professional certifications and licenses.">
      <div className="space-y-3">
        {resume.certifications.map((cert) =>
          editId === cert.id ? (
            <CertificationForm
              key={cert.id}
              initial={cert}
              onSave={(data) => { updateCertification(cert.id, data); setEditId(null); }}
              onCancel={() => setEditId(null)}
            />
          ) : (
            <div key={cert.id} className="flex items-start justify-between border border-gray-200 rounded-lg p-4">
              <div>
                <p className="font-medium text-gray-900">{cert.name}</p>
                <p className="text-sm text-gray-600">{cert.issuer}</p>
                <p className="text-xs text-gray-400 mt-0.5">Issued: {cert.date}{cert.expiryDate ? ` · Expires: ${cert.expiryDate}` : ''}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setEditId(cert.id)} className="text-sm text-primary-600 hover:underline">Edit</button>
                <button onClick={() => removeCertification(cert.id)} className="text-sm text-red-500 hover:underline">Remove</button>
              </div>
            </div>
          ),
        )}

        {showForm && !editId && (
          <CertificationForm
            onSave={(data) => { addCertification(data); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {!showForm && !editId && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            + Add Certification
          </button>
        )}
      </div>
    </StepLayout>
  );
}
