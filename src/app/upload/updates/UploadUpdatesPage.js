"use client";
import Link from "next/link";
import { Navbar } from '../../components/Navbar';
import AddUpdateForm from './AddUpdateForm';
import UpdatesList from './UpdatesList';

export default function UploadUpdatesPage() {
  return (
    <>
      <div style={{ maxWidth: 900, margin: '28px auto', padding: '0 16px' }}>
        <Link href="/updates" style={{ textDecoration: 'none' }}>
          <div
            className="learnix-updates-banner"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 20px',
              borderRadius: 8,
              background: 'linear-gradient(90deg, #ffd76a, #ffb84d)',
              color: '#111',
              cursor: 'pointer',
              marginBottom: 20,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>Manage your Updates</h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.95 }}>
                Click to view and manage existing updates.
              </p>
            </div>
            <div style={{ fontSize: 14, opacity: 0.95 }}>Go to updates →</div>
          </div>
        </Link>

        <main style={{ background: '#fff', padding: 18, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Create a new Update</h3>
          <AddUpdateForm />

          <UpdatesList />
        </main>
      </div>
    </>
  );
}
