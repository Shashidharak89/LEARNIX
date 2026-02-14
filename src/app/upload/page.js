"use client";

import ManageSubjects from "./ManageSubjects";
import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";


export default function upload() {

  return (
    <div >
      <Navbar />
      <div style={{ maxWidth: 900, margin: '18px auto', padding: '0 16px' }}>
        <a href="/upload/updates" style={{ textDecoration: 'none' }}>
          <div
            className="learnix-updates-banner"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 8,
              background: 'linear-gradient(90deg, #ffd76a, #ffb84d)',
              color: '#111',
              cursor: 'pointer',
              marginBottom: 18,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 16 }}>View and manage your Updates</h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.95 }}>
                Click to open the Updates manager where you can create, edit and delete updates.
              </p>
            </div>
            <div style={{ fontSize: 13, opacity: 0.95 }}>Manage →</div>
          </div>
        </a>

        <ManageSubjects />
      </div>

    </div>
  );
}
