import { connectDB } from '@/lib/db';
import ChunkUpload from '@/models/ChunkUpload';
import File from '@/models/File';

function humanSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B','KB','MB','GB','TB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val = val / 1024;
    i++;
  }
  return `${val.toFixed(2)} ${units[i]}`;
}

export default async function Page() {
  await connectDB();

  const chunkUploads = await ChunkUpload.find({ completed: true }).sort({ createdAt: -1 }).lean().limit(50);
  const files = await File.find({}).sort({ createdAt: -1 }).lean().limit(50);

  return (
    <div style={{ padding: 20 }}>
      <h2>Uploaded (Chunk Uploads)</h2>
      {chunkUploads.length === 0 ? (
        <p>No completed chunk uploads found.</p>
      ) : (
        <ul>
          {chunkUploads.map((u) => (
            <li key={u.uploadId} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {u.resourceType && u.resourceType.startsWith('image') && u.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.url} alt={u.filename || u.uploadId} width={96} style={{ borderRadius: 6 }} />
                ) : (
                  <div style={{ width: 96, height: 64, background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>{u.resourceType || 'file'}</div>
                )}

                <div>
                  <div style={{ fontWeight: 600 }}>{u.filename || u.uploadId}</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{u.resourceType} • {humanSize(u.bytes)}</div>
                  <div style={{ marginTop: 6 }}>
                    {u.url ? (
                      <a href={u.url} target="_blank" rel="noreferrer">Open file</a>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>No URL available</span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <hr style={{ margin: '24px 0' }} />

      <h2>Files (File model)</h2>
      {files.length === 0 ? (
        <p>No files found in `File` model.</p>
      ) : (
        <ul>
          {files.map((f) => (
            <li key={f._id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {f.cloudinaryUrl && f.mimeType && f.mimeType.startsWith('image') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.cloudinaryUrl} alt={f.originalName} width={96} style={{ borderRadius: 6 }} />
                ) : (
                  <div style={{ width: 96, height: 64, background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>{f.mimeType || 'file'}</div>
                )}

                <div>
                  <div style={{ fontWeight: 600 }}>{f.originalName} <small style={{ color:'#6b7280' }}>#{f.fileid}</small></div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{f.mimeType} • {humanSize(f.size)}</div>
                  <div style={{ marginTop: 6 }}>
                    <a href={f.cloudinaryUrl} target="_blank" rel="noreferrer">Open file</a>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
