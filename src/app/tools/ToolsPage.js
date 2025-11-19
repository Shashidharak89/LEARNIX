import DOCXConverterMinimal from "../upload/DOCXConverter";
import "./styles/ToolsPage.css";

export default function ToolsPage() {
  return (
    <div className="tools-page">
      <div className="tools-container">
        <h1>Tools</h1>
        <div className="tools-section">
          <h2>Document Conversion Tools</h2>
          <div className="tool-item">
            <h3>Word to PDF Converter</h3>
            <p>Upload a Microsoft Word document (.docx) to convert it to PDF format.</p>
            <DOCXConverterMinimal />
          </div>
          {/* Add more tools here in the future */}
        </div>
      </div>
    </div>
  );
}
