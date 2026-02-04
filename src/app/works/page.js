import { Suspense } from "react";
import { Navbar } from "../components/Navbar";
import WorkSearchInterface from "./WorkSearchInterface";

function WorksLoading() {
    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '50vh',
            padding: '2rem'
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
        </div>
    );
}

export default function Works() {
    return (
        <div>
            <Navbar />
            <Suspense fallback={<WorksLoading />}>
                <WorkSearchInterface />
            </Suspense>
        </div>
    );
}
