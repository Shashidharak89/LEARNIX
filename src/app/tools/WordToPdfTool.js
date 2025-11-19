import React, { useState } from 'react';
import styles from './styles/WordToPdfTool.css';

export default function WordToPdfTool() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setStatus('');
  };

  const handleConvert = async () => {
    if (!file) {
      setStatus('Please select a .docx/.doc file.');
      return;
    }
    setLoading(true);
    setStatus('Uploading...');
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Call your backend Next.js API route e.g. /api/convertWordToPdf
      const res = await fetch('/api/convertWordToPdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Conversion failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.(docx?|DOCX?)$/, '.pdf');
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setStatus('Conversion complete — download starting.');
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + (err.message || 'Conversion failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.toolContainer}>
      <h2 className={styles.title}>Word → PDF</h2>
      <p className={styles.description}>Upload a Word document (.doc / .docx) to convert it to PDF.</p>
      <input
        type="file"
        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        className={styles.fileInput}
      />
      <div className={styles.actions}>
        <button
          onClick={handleConvert}
          className={styles.btnConvert}
          disabled={loading}
        >
          {loading ? 'Converting...' : 'Convert'}
        </button>
      </div>
      {status && <div className={styles.status}>{status}</div>}
    </div>
  );
}
