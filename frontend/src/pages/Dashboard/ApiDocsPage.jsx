import React, { useState } from 'react';
import { 
  Code2, 
  Key, 
  Copy, 
  Check, 
  Terminal, 
  FileCode, 
  Layers, 
  Sparkles, 
  ShieldAlert, 
  Send,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '../../components/Toast';

export const ApiDocsPage = ({ user }) => {
  const { addToast } = useToast();
  const [selectedSnippetLang, setSelectedSnippetLang] = useState('python');
  const [apiKey, setApiKey] = useState('nx_live_9941a8e2bc704f1298d0112');
  const [copiedKey, setCopiedKey] = useState(false);

  const handleGenerateKey = () => {
    const newKey = `nx_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(newKey);
    addToast('New API Secret Key generated!', 'success');
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    addToast('API Key copied to clipboard', 'info');
  };

  const [liveTestEndpoint, setLiveTestEndpoint] = useState('/api/health');
  const [liveTestResponse, setLiveTestResponse] = useState(null);
  const [isTestingLive, setIsTestingLive] = useState(false);

  const handleRunLiveTest = async (endpoint) => {
    setLiveTestEndpoint(endpoint);
    setIsTestingLive(true);
    setLiveTestResponse(null);
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      setLiveTestResponse(data);
      addToast(`Received ${response.status} OK from ${endpoint}`, 'success');
    } catch (err) {
      setLiveTestResponse({ error: err.message, note: 'Backend server is currently offline. Start with: uvicorn backend.main:app --port 8000' });
      addToast(`Could not reach ${endpoint}. Is backend running on port 8000?`, 'warning');
    } finally {
      setIsTestingLive(false);
    }
  };

  const snippets = {
    python: `import requests
import time

BASE_URL = "http://localhost:8000"

# 1. Queue a PDF translation task (English -> Gujarati)
with open("Panchatantra.pdf", "rb") as f:
    response = requests.post(
        f"{BASE_URL}/api/translate",
        files={"file": f},
        data={
            "src_lang": "en",
            "tgt_lang": "gu"  # Supports 22 Indic + Global languages
        }
    )

job = response.json()
job_id = job["job_id"]
print(f"Queued Job ID: {job_id}")

# 2. Poll for translation & HarfBuzz vector layout completion
while True:
    status = requests.get(f"{BASE_URL}/api/jobs/{job_id}").json()
    print(f"Status: {status['status']} | Progress: {status.get('progress', 0)}%")
    if status["status"] in ("completed", "failed"):
        break
    time.sleep(2)

# 3. Download translated PDF with preserved visual layout
if status["status"] == "completed":
    pdf_res = requests.get(f"{BASE_URL}/api/jobs/{job_id}/download")
    with open("Panchatantra_Gujarati.pdf", "wb") as out:
        out.write(pdf_res.content)
    print("Downloaded translated PDF successfully!")`,

    curl: `# 1. Submit PDF translation job to Nexus offline pipeline
curl -X POST "http://localhost:8000/api/translate" \\
  -F "file=@./Panchatantra.pdf" \\
  -F "src_lang=en" \\
  -F "tgt_lang=gu"

# Expected Response:
# {"job_id":"job_9a8b7c6d","filename":"Panchatantra.pdf","status":"queued"}

# 2. Check translation progress
curl -X GET "http://localhost:8000/api/jobs/job_9a8b7c6d"

# 3. Download completed PDF with HarfBuzz complex-script shaping
curl -X GET "http://localhost:8000/api/jobs/job_9a8b7c6d/download" \\
  --output "Panchatantra_Gujarati.pdf"`,

    nodejs: `import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8000';

async function translateDocument() {
  const form = new FormData();
  form.append('file', fs.createReadStream('./Panchatantra.pdf'));
  form.append('src_lang', 'en');
  form.append('tgt_lang', 'gu');

  // Submit translation job
  const res = await fetch(\`\${BASE_URL}/api/translate\`, { method: 'POST', body: form });
  const { job_id } = await res.json();
  console.log(\`Job Queued: \${job_id}\`);

  // Poll status
  let isDone = false;
  while (!isDone) {
    await new Promise(r => setTimeout(r, 2000));
    const statusRes = await fetch(\`\${BASE_URL}/api/jobs/\${job_id}\`);
    const status = await statusRes.json();
    console.log(\`Progress: \${status.progress}% (\${status.completed_pages}/\${status.total_pages} pgs)\`);
    if (status.status === 'completed') isDone = true;
  }

  // Download translated PDF
  const dlRes = await fetch(\`\${BASE_URL}/api/jobs/\${job_id}/download\`);
  const buffer = await dlRes.buffer();
  fs.writeFileSync('./Panchatantra_Translated.pdf', buffer);
  console.log('Saved translated PDF with layout preservation!');
}

translateDocument();`
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
          <span className="badge badge-primary">REST API v2.4</span>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>OpenAPI 3.1 Specification</span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
          Developer REST API & Code Snippets
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Integrate the multilingual OCR pipeline into your Python pipelines, Node.js microservices, or backend queues.
        </p>
      </div>

      {/* API Key Management Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              Active Pipeline API Key
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Use this bearer token to authenticate requests from your servers.
            </p>
          </div>

          <button
            onClick={handleGenerateKey}
            className="btn btn-secondary btn-sm"
          >
            <Key size={14} />
            <span>Generate New Secret Key</span>
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f8fafc',
          padding: '8px 12px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          flexWrap: 'wrap'
        }}>
          <Key size={16} color="#2563eb" style={{ flexShrink: 0 }} />
          <code style={{ flex: '1 1 200px', fontSize: '0.88rem', color: '#0f172a', fontWeight: 600, wordBreak: 'break-all' }}>
            {apiKey}
          </code>
          <button
            onClick={handleCopyKey}
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 10px', fontSize: '0.8rem' }}
          >
            {copiedKey ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copiedKey ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Snippets Section */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '0.75rem 1.25rem',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
              Interactive Code Integration
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'python', label: 'Python 3' },
              { id: 'curl', label: 'cURL CLI' },
              { id: 'nodejs', label: 'Node.js (TS/JS)' }
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedSnippetLang(lang.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: selectedSnippetLang === lang.id ? '#2563eb' : '#ffffff',
                  color: selectedSnippetLang === lang.id ? '#ffffff' : '#64748b',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedSnippetLang === lang.id ? '#2563eb' : '#e2e8f0'
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '1.25rem', background: '#0f172a' }}>
          <pre style={{
            color: '#38bdf8',
            fontSize: '0.82rem',
            lineHeight: 1.6,
            fontFamily: 'var(--font-mono)',
            overflowX: 'auto',
            margin: 0
          }}>
            {snippets[selectedSnippetLang]}
          </pre>
        </div>

        <div style={{
          padding: '1rem 1.25rem',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem',
          color: '#64748b'
        }}>
          <span>Standard response format: <code>application/json</code> (HTTP 200 OK)</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(snippets[selectedSnippetLang]);
              addToast('Code snippet copied!', 'success');
            }}
            className="btn btn-secondary btn-sm"
          >
            <Copy size={14} />
            <span>Copy Snippet</span>
          </button>
        </div>
      </div>

      {/* Interactive Live Endpoint Tester */}
      <div style={{
        marginTop: '2rem',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
              Interactive Live API Tester
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
              Send real queries directly to the local FastAPI backend and inspect response JSON payloads.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleRunLiveTest('/api/health')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              <span>GET /api/health</span>
            </button>
            <button
              onClick={() => handleRunLiveTest('/api/models/status')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              <span>GET /api/models/status</span>
            </button>
            <button
              onClick={() => handleRunLiveTest('/api/languages')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              <span>GET /api/languages</span>
            </button>
          </div>
        </div>

        <div style={{
          background: '#0f172a',
          borderRadius: '10px',
          padding: '1rem',
          minHeight: '140px',
          maxHeight: '360px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
              Endpoint: <strong style={{ color: '#38bdf8' }}>{liveTestEndpoint}</strong>
            </span>
            {isTestingLive && (
              <span style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Executing HTTP GET...</span>
              </span>
            )}
          </div>

          <pre style={{
            margin: 0,
            fontSize: '0.78rem',
            color: liveTestResponse?.error ? '#f87171' : '#a7f3d0',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {liveTestResponse ? JSON.stringify(liveTestResponse, null, 2) : '// Click one of the test buttons above to ping live FastAPI endpoints.'}
          </pre>
        </div>
      </div>

    </div>
  );
};
