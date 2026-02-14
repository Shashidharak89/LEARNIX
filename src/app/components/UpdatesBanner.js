"use client";

import Link from 'next/link';
import { FiBell } from 'react-icons/fi';
import '../tools/styles/TextShare.css'; // Import for tst- classes

export default function UpdatesBanner() {
  return (
    <div className="tst-card tst-intro" style={{ margin: '20px auto', maxWidth: 1000 }}>
      <div className="tst-section-header">
        <FiBell className="ti-section-icon ti-icon-textshare" />
        <h3 className="ti-subtitle">Latest Updates</h3>
      </div>
      <p className="ti-plain">
        See the most recent activity — subjects and public topics created by users.
      </p>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Link href="/updates" className="tst-btn tst-btn-primary">View Updates</Link>
      </div>
    </div>
  );
}
