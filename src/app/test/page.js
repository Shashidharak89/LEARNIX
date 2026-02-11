import '../globals.css';
import { Navbar } from '../components/Navbar';

export default function TestPage() {
  return (
    <>
    <Navbar/>
      <main className="tst-page-container tst-card tst-intro" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 className="tst-title" style={{ color: '#f2c200', marginBottom: '16px' }}>Test Page</h1>
        <p className="tst-meta" style={{ color: '#ff9500', fontSize: '18px', marginBottom: '24px' }}>This page is for testing purposes only.</p>
        <div className="tst-plain" style={{ color: '#0b0b0b', fontSize: '16px', maxWidth: '500px', textAlign: 'center' }}>
          You can use this page to try out new components, layouts, or features. There are no navigation links to this page; access it directly via <code>/test</code>.
        </div>
      
      </main>
    </>
  );
}
