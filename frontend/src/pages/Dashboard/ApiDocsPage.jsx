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

  const snippets = {
    python: `import requests

url = "https://api.nexusocr.ai/v2/pipeline/extract"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "X-Engine-Mode": "multilingual-deep-transformer"
}

files = {
    "document": open("japanese_tax_certificate.pdf", "rb")
}

data = {
    "target_language": "ja",
    "extract_tables": "true",
    "extract_entities": "true",
    "translate_to": "en"
}

response = requests.post(url, headers=headers, files=files, data=data)
extraction_result = response.json()

print(f"Recognized Script: {extraction_result['detected_script']}")
print(f"Confidence: {extraction_result['confidence']}%")
for entity in extraction_result['entities']:
    print(f"  [{entity['tag']}] {entity['label']}: {entity['value']}")`,

    curl: `curl -X POST "https://api.nexusocr.ai/v2/pipeline/extract" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "X-Engine-Mode: multilingual-deep-transformer" \\
  -F "document=@./hindi_hospital_discharge.jpg" \\
  -F "target_language=hi" \\
  -F "extract_tables=true" \\
  -F "extract_entities=true" \\
  -F "translate_to=en"`,

    nodejs: `import { NexusOCR } from '@nexusocr/sdk';
import fs from 'fs';

const client = new NexusOCR({
  apiKey: '${apiKey}',
  cluster: 'us-east-gpu'
});

async function runMultilingualOCR() {
  const result = await client.pipeline.extract({
    file: fs.createReadStream('./german_supply_invoice.pdf'),
    language: 'de',
    features: ['NER', 'TABLE_EXTRACTION', 'TRANSLATION'],
    translateTo: 'en'
  });

  console.log('Entities extracted:', result.entities);
  console.log('Structured Table Data:', result.tables);
}

runMultilingualOCR();`
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
          border: '1px solid #e2e8f0'
        }}>
          <Key size={16} color="#2563eb" />
          <code style={{ flex: 1, fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 }}>
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

    </div>
  );
};
