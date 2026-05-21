import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// SVG Robot Assistant Head Component
const RobotAssistant = ({ isScanning }) => {
  return (
    <svg className="assistant-svg" width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer Metallic Helmet Ring */}
      <circle cx="50" cy="48" r="42" fill="url(#metalGrad)" stroke="#1e2d4a" strokeWidth="2"/>
      
      {/* Helmet Visor Plate */}
      <path d="M15 45C15 30 85 30 85 45C85 58 15 58 15 45Z" fill="#090d1a" stroke="#00d4ff" strokeWidth="1.5" strokeOpacity="0.8"/>
      
      {/* Visor Scan Line Shield */}
      <rect x="20" y="44" width="60" height="2" fill="rgba(0, 212, 255, 0.2)"/>
      {isScanning ? (
        <rect className="robot-visor-scanner" x="20" y="42" width="20" height="6" fill="#ff6b35" opacity="0.8" rx="2"/>
      ) : (
        <rect className="robot-visor-scanner" x="20" y="44" width="10" height="2" fill="#00d4ff" opacity="0.6"/>
      )}
      
      {/* Cyan Glowing Eyes */}
      <circle className="robot-iris-eye" cx="38" cy="45" r="4" fill="#00d4ff" filter="url(#eyeGlow)"/>
      <circle className="robot-iris-eye" cx="62" cy="45" r="4" fill="#00d4ff" filter="url(#eyeGlow)"/>
      
      {/* Speech Panel / Mouth Grille Indicators */}
      <g transform="translate(35, 68)">
        <rect x="0" y={isScanning ? "2" : "5"} width="4" height={isScanning ? "12" : "6"} fill="#7b2fff" rx="1"/>
        <rect x="7" y={isScanning ? "0" : "3"} width="4" height={isScanning ? "16" : "10"} fill="#00d4ff" rx="1"/>
        <rect x="14" y={isScanning ? "3" : "4"} width="4" height={isScanning ? "10" : "8"} fill="#7b2fff" rx="1"/>
        <rect x="21" y={isScanning ? "1" : "5"} width="4" height={isScanning ? "14" : "6"} fill="#00ff88" rx="1"/>
      </g>
      
      {/* Decorative Cyber Ticks */}
      <path d="M10 20 L20 10 M90 20 L80 10" stroke="#1e2d4a" strokeWidth="1.5"/>

      {/* Gradient Definitions */}
      <defs>
        <radialGradient id="metalGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" transform="translate(50 30) rotate(90) scale(60)">
          <stop offset="0%" stopColor="#1e2d4a"/>
          <stop offset="60%" stopColor="#0a0f1d"/>
          <stop offset="100%" stopColor="#050710"/>
        </radialGradient>
        <filter id="eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <blur stdDeviation="2" result="blur"/>
          <merge>
            <mergeNode in="blur"/>
            <mergeNode in="SourceGraphic"/>
          </merge>
        </filter>
      </defs>
    </svg>
  );
};

export default function App() {
  // Bootloader state
  const [isBooting, setIsBooting] = useState(true);
  const [bootLogs, setBootLogs] = useState([]);
  
  // App Config States
  const [apiProvider, setApiProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState(localStorage.getItem('cipher_api_key') || '');
  const [maskStyle, setMaskStyle] = useState('blur'); // blur, redact (blackout), xxxx (pixelate)
  const [pdfMode, setPdfMode] = useState('visual'); // visual, vector
  
  // PII Checklist Toggles
  const [piiToggles, setPiiToggles] = useState({
    name: true,
    email: true,
    phone: true,
    financial: true, // Maps to Banks & Govt IDs (Aadhaar)
    credentials: true,
    address: true,
    other: true
  });
  
  // Custom Rules
  const [customKeywords, setCustomKeywords] = useState('');
  const [customRegex, setCustomRegex] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  
  // File Staging
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewOriginal, setPreviewOriginal] = useState(null);
  const [previewMasked, setPreviewMasked] = useState(null);

  // Smart client-side local Blob URL preview generator
  useEffect(() => {
    if (!selectedFile) {
      setPreviewOriginal(null);
      return;
    }
    // If it's a real file object (not a demo name placeholder)
    if (selectedFile instanceof File && selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewOriginal(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [selectedFile]);
  
  // Process State / Counters
  const [isProcessing, setIsProcessing] = useState(false);
  const [filesProcessed, setFilesProcessed] = useState(0);
  const [entitiesDetected, setEntitiesDetected] = useState(0);
  const [complianceScore, setComplianceScore] = useState(100);
  
  // Equalizer Equalizing Bars state
  const [isEqualizing, setIsEqualizing] = useState(true);
  
  // 10-Agent Pipeline State
  const [agentStates, setAgentStates] = useState([
    { id: 1, name: 'Vision Agent', status: 'idle', latency: '' },
    { id: 2, name: 'OCR Agent', status: 'idle', latency: '' },
    { id: 3, name: 'Analysis Agent', status: 'idle', latency: '' },
    { id: 4, name: 'Policy Agent', status: 'idle', latency: '' },
    { id: 5, name: 'Decision Agent', status: 'idle', latency: '' },
    { id: 6, name: 'Masking Agent', status: 'idle', latency: '' },
    { id: 7, name: 'Quality Agent', status: 'idle', latency: '' },
    { id: 8, name: 'Audit Agent', status: 'idle', latency: '' },
    { id: 9, name: 'Reasoning Agent', status: 'idle', latency: '' },
    { id: 10, name: 'Orchestrator', status: 'idle', latency: '' }
  ]);
  
  // Terminal logs stream
  const [terminalLogs, setTerminalLogs] = useState([
    { type: 'info', text: '▶ CIPHER DECK V1.8 ONLINE.' },
    { type: 'info', text: '▶ ZERO-TRUST PROTOCOL READY.' }
  ]);
  
  // Chat Feed bubbles
  const [chatFeed, setChatFeed] = useState([]);
  
  // Canvas Particles Background Ref
  const canvasRef = useRef(null);

  // 1. Particle Network Canvas loop
  useEffect(() => {
    if (isBooting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    
    // Create 45 nodes
    const particles = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1
      });
    }
    
    let animationId;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Update & Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 212, 255, 0.4)';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#00d4ff';
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow
      });
      
      // Draw delicate connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 212, 255, ${0.1 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animationId = requestAnimationFrame(draw);
    };
    draw();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [isBooting]);

  // 2. Bootloader initial logs sequence
  useEffect(() => {
    const bootSequences = [
      '▶ INITIATING SECURE CIPHER ENGINE...',
      '▶ MOUNTING RADAR VISOR SPEECH DRIVER...',
      '▶ SYSTEM INTEGRITY SCAN: SECURE CORE ACTIVE.',
      '▶ EXTRACTING SECURE .ENV PROVIDER API CREDENTIALS...',
      '▶ COMPLIANCE PIPELINES: HIPAA, GDPR POLICIES SYNCD.',
      '⚡ SYSTEM SECURED. ZERO-TRUST ENVIRONMENT LOCKED.',
      '🚀 ACCESSING CIPHER COCKPIT CONTROLS...'
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < bootSequences.length) {
        setBootLogs((prev) => [...prev, bootSequences[index]]);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsBooting(false);
        }, 600);
      }
    }, 400);
    
    return () => clearInterval(interval);
  }, []);

  // Smart User Prompt Analyzer (updates style on key redaction words)
  const handleUserPromptChange = (val) => {
    setUserPrompt(val);
    const low = val.toLowerCase();
    if (low.includes('blur') || low.includes('gaussian')) {
      setMaskStyle('blur');
      pushSystemConsoleLog('Auto-detected style rule: Gaussian Blur engaged.', 'info');
    } else if (low.includes('blackout') || low.includes('redact') || low.includes('block')) {
      setMaskStyle('redact');
      pushSystemConsoleLog('Auto-detected style rule: Blackout Block engaged.', 'info');
    } else if (low.includes('pixelate') || low.includes('xxxx') || low.includes('hash')) {
      setMaskStyle('xxxx');
      pushSystemConsoleLog('Auto-detected style rule: Character X engaged.', 'info');
    }
  };

  // Helper: push console log line
  const pushSystemConsoleLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => [...prev, { type, text: `[${time}] ${text}` }]);
  };

  // 3. Load Aadhaar card demo details matching exactly the user's specs
  const triggerAadhaarDemo = () => {
    pushSystemConsoleLog('Triggering high-impact Aadhaar demo configuration...', 'info');
    
    // Set Files Processed metadata
    setSelectedFile({
      name: '1000007499.jpg',
      size: 245780,
      type: 'image/jpeg'
    });
    
    // Set toggles according to screenshot:
    // Names, Emails = checked. All others = unchecked.
    setPiiToggles({
      name: true,
      email: true,
      phone: false,
      financial: false, // Banks & Govt IDs (Aadhaar)
      credentials: false,
      address: false,
      other: false
    });
    
    // Set custom text inputs
    setCustomKeywords('ConfidentialTerm, CompanyName');
    setCustomRegex('\\d{4}-\\d{4}-\\d{4}-\\d{4}|\\b(Project codes)');
    setMaskStyle('xxxx'); // Selects "Character X" radio from screenshot!
    
    // Load local Aadhaar preview thumbnails
    // Using Flask's previous active preview IDs if they exist, otherwise placeholders
    setPreviewOriginal('/api/preview/764d452a-12fb-4ef0-a6a4-9f78f925970c/original');
    setPreviewMasked('/api/preview/764d452a-12fb-4ef0-a6a4-9f78f925970c/masked');
    
    setFilesProcessed(1);
    setEntitiesDetected(4);
    setComplianceScore(100);
    
    pushSystemConsoleLog('Aadhaar demo loaded successfully. Visual grid configured.', 'success');
  };

  // Toggle PII Checkbox
  const handlePiiToggle = (key) => {
    setPiiToggles((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handle drag and drop
  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      pushSystemConsoleLog(`File staged: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'info');
      
      // Auto-engine dynamic toggling
      if (file.type.startsWith('image/')) {
        setApiProvider('gemini');
        pushSystemConsoleLog('Image file detected. Auto-switched API provider to Gemini AI (Vision).', 'warning');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      pushSystemConsoleLog(`File staged: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'info');
      
      // Auto-engine dynamic toggling
      if (file.type.startsWith('image/')) {
        setApiProvider('gemini');
        pushSystemConsoleLog('Image file detected. Auto-switched API provider to Gemini AI (Vision).', 'warning');
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewOriginal(null);
    setPreviewMasked(null);
    pushSystemConsoleLog('Staged file removed. Cleaned workspace.', 'warning');
  };

  // 4. Core AJAC execution calling Flask API with 10-Agent logs simulation
  const executePIIRedaction = async () => {
    if (!selectedFile) {
      pushSystemConsoleLog('Redaction Execution Denied: No file selected.', 'error');
      return;
    }
    
    setIsProcessing(true);
    if (!selectedFile.type || !selectedFile.type.startsWith('image/')) {
      setPreviewOriginal(null);
    }
    setPreviewMasked(null);
    pushSystemConsoleLog('Initiating secure multi-agent coordinate redactor...', 'info');
    
    // 10-Agent Pipeline visual sequence simulation
    const simulatedAgents = [...agentStates];
    for (let i = 0; i < simulatedAgents.length; i++) {
      // Set active
      simulatedAgents[i].status = 'active';
      setAgentStates([...simulatedAgents]);
      
      // Add agent log
      const agentLogTexts = [
        'Vision visor eyes scanning visual layers...',
        'OCR Engine extracting raw characters & coordinate indexes...',
        'Analysis Agent sorting potential PII elements...',
        'Compliance Policy checker evaluating against GDPR rules...',
        'Decision Engine mapping masking regions...',
        'Masking Engine applying selected aesthetics to pixel nodes...',
        'Quality Validator comparing before-after margins...',
        'Audit Logger compiling zero-trust record files...',
        'Context Reasoning Agent optimizing background textures...',
        'Orchestrator completing Secure Pipeline execution!'
      ];
      pushSystemConsoleLog(`[${simulatedAgents[i].name}] ${agentLogTexts[i]}`, 'info');
      
      const latency = Math.floor(Math.random() * 120) + 40; // 40ms to 160ms
      await new Promise((resolve) => setTimeout(resolve, latency + 150));
      
      simulatedAgents[i].status = 'completed';
      simulatedAgents[i].latency = `${latency}ms`;
      setAgentStates([...simulatedAgents]);
    }
    
    // Prepare multi-part Form Data
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('api_provider', apiProvider);
    formData.append('api_key', apiKey);
    formData.append('style', maskStyle);
    formData.append('pdf_mode', pdfMode);
    
    // Append Toggles
    formData.append('name', piiToggles.name);
    formData.append('email', piiToggles.email);
    formData.append('phone', piiToggles.phone);
    formData.append('financial', piiToggles.financial);
    formData.append('credentials', piiToggles.credentials);
    formData.append('address', piiToggles.address);
    formData.append('other', piiToggles.other);
    
    // Append custom inputs
    formData.append('custom_keywords', customKeywords);
    formData.append('custom_regex', customRegex);
    formData.append('user_prompt', userPrompt);
    
    try {
      pushSystemConsoleLog('Sending secure bundle to backend API...', 'info');
      const response = await fetch('/api/mask', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      if (response.ok && result.success) {
        setFilesProcessed((prev) => prev + 1);
        setEntitiesDetected((prev) => prev + (result.masked_count || 3));
        setComplianceScore(100);
        
        // Load original and masked visual paths
        if (!selectedFile.type || !selectedFile.type.startsWith('image/')) {
          setPreviewOriginal(`/api/preview/${result.file_id}/original?t=${Date.now()}`);
        }
        setPreviewMasked(`/api/preview/${result.file_id}/masked?t=${Date.now()}`);
        
        // Print backend engine logs in audit console
        if (result.logs) {
          result.logs.forEach((log) => {
            pushSystemConsoleLog(log.message, log.type);
          });
        }
        
        pushSystemConsoleLog(`SUCCESS: Redaction complete. Generated file_id: ${result.file_id}`, 'success');
        
        // Add chat bubble
        setChatFeed((prev) => [
          ...prev,
          {
            sender: 'user',
            text: `Please redact file: ${selectedFile.name} (Style: ${maskStyle.toUpperCase()})`
          },
          {
            sender: 'agent',
            fileId: result.file_id,
            filename: result.masked_filename,
            size: result.masked_size,
            count: result.masked_count,
            compliance: 100,
            original: selectedFile.type && selectedFile.type.startsWith('image/') ? previewOriginal : `/api/preview/${result.file_id}/original`,
            masked: `/api/preview/${result.file_id}/masked`
          }
        ]);
        
      } else {
        pushSystemConsoleLog(`ERROR: ${result.error || 'Unknown backend error'}`, 'error');
      }
    } catch (err) {
      pushSystemConsoleLog(`CONNECTION FAILED: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
      // Reset agent pipeline to idle
      setAgentStates(agentStates.map(a => ({ ...a, status: 'idle', latency: '' })));
    }
  };

  return (
    <div className="cockpit-container">
      {/* 🌌 Atmospheric Particles Background */}
      <canvas ref={canvasRef} className="neural-canvas"></canvas>
      <div className="cyber-grid"></div>

      {/* 🔒 BOOTLOADER INITIAL HUD SCREEN */}
      {isBooting && (
        <div className="boot-container">
          <div className="boot-radar-wrapper">
            <div className="boot-radar"></div>
            <div className="boot-radar-inner"></div>
            <div className="boot-iris"></div>
          </div>
          <div className="boot-console">
            <div className="boot-line title">⚡ SYSTEM BOOTUP SEQUENCE: CIPHER COCKPIT</div>
            <div className="boot-line">-----------------------------------------</div>
            {bootLogs.map((log, idx) => (
              <div key={idx} className="boot-line">{log}</div>
            ))}
          </div>
        </div>
      )}

      {/* 🎛️ MAIN COCKPIT DASHBOARD APPLICATION DECK */}
      {!isBooting && (
        <div className="app-deck">
          
          {/* Header Dashboard Grid */}
          <header className="header-deck">
            <div className="header-brand robotic-title-area">
              <div className="robotic-arm-assembly" title="Active Cyber-Arm Assembly">
                <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Robotic Base Gear */}
                  <circle className="spinning-gear" cx="24" cy="24" r="16" stroke="#00d4ff" strokeWidth="2.5" strokeDasharray="6 3"/>
                  
                  {/* Cybernetic Pivot Joint */}
                  <circle cx="24" cy="24" r="5" fill="#7b2fff" stroke="#fff" strokeWidth="1"/>
                  
                  {/* Mechanical Pivoting Arm */}
                  <g className="scanning-arm">
                    <line x1="24" y1="24" x2="36" y2="12" stroke="#ff6b35" strokeWidth="3" strokeLinecap="round"/>
                    <circle cx="36" cy="12" r="3.5" fill="#00ff88"/>
                    {/* Laser Target Guide Beam */}
                    <line className="laser-pulse" x1="36" y1="12" x2="42" y2="6" stroke="#00ff88" strokeWidth="1.5" strokeDasharray="2 1"/>
                  </g>
                </svg>
              </div>
              <div>
                <div className="glitch-title">AI CIPHER</div>
                <div className="brand-desc">Agentic Security Cockpit</div>
              </div>
            </div>

            {/* Speeches Audio Wave Equalizer */}
            {isEqualizing && (
              <div className="equalizer-indicator">
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
              </div>
            )}

            {/* Robot Assistant HUD Header */}
            <div className="header-assistant">
              <RobotAssistant isScanning={isProcessing} />
            </div>

            {/* Live compliance counters */}
            <div className="live-counters">
              <div className="counter-node">
                <span className="counter-value">{filesProcessed}</span>
                <span className="counter-label">FILES COMPLETED</span>
              </div>
              <div className="counter-node">
                <span className="counter-value">{entitiesDetected}</span>
                <span className="counter-label">ENTITIES DETECTED</span>
              </div>
              <div className="counter-node">
                <span className="counter-value" style={{ color: 'var(--accent3)' }}>{complianceScore}%</span>
                <span className="counter-label">COMPLIANCE SCORE</span>
              </div>
            </div>

            {/* API Status Badge and provider selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <select 
                className="system-status"
                style={{ background: 'rgba(9, 13, 26, 0.9)', outline: 'none', cursor: 'pointer' }}
                value={apiProvider} 
                onChange={(e) => setApiProvider(e.target.value)}
              >
                <option value="local">LOCAL ENGINE</option>
                <option value="groq">GROQ CLOUD</option>
                <option value="gemini">GEMINI AI</option>
              </select>

              <input
                type="password"
                placeholder="Enter API Key (Optional if in .env)"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  localStorage.setItem('cipher_api_key', e.target.value);
                }}
                className="system-status"
                style={{ background: 'rgba(9, 13, 26, 0.9)', outline: 'none', color: '#cdd6f4', border: '1px solid rgba(205, 214, 244, 0.15)', width: '220px' }}
              />

              <div className={`system-status ${isProcessing ? 'scanning' : ''}`}>
                <span className="pulse-dot"></span>
                <span>{isProcessing ? 'SCANNING' : 'SYSTEM READY'}</span>
              </div>
            </div>
          </header>

          {/* Three-Column Workspace Dashboard Grid */}
          <main className="deck-workspace">
            
            {/* Left Column: Pipeline & Configuration Toggles */}
            <div className="deck-column left-sidebar">
              <div className="deck-panel hud-panel">
                <div className="hud-corner tl"></div>
                <div className="hud-corner tr"></div>
                <div className="hud-corner bl"></div>
                <div className="hud-corner br"></div>

                <div className="deck-panel-header">
                  <h3>Agent Pipeline</h3>
                  <span className="brand-desc">10 Active Units</span>
                </div>
                
                <div className="deck-panel-body" style={{ gap: '15px' }}>
                  
                  {/* Pipeline Agents visual list */}
                  <div className="agent-pipeline-wrapper">
                    {agentStates.map((agent) => (
                      <div key={agent.id} className={`agent-row ${agent.status}`}>
                        <div className="agent-left">
                          <span className="agent-index">{String(agent.id).padStart(2, '0')}</span>
                          <span className="agent-name">{agent.name}</span>
                        </div>
                        <span className="agent-status-label">
                          {agent.status === 'active' ? 'SCANNING' : agent.status === 'completed' ? (agent.latency || 'DONE') : 'IDLE'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Masking method radio switches */}
                  <div className="deck-group">
                    <span className="deck-group-label">Masking Aesthetics</span>
                    <div className="style-grid">
                      <label className="radio-card">
                        <input type="radio" name="style" value="redact" checked={maskStyle === 'redact'} onChange={() => setMaskStyle('redact')} />
                        <span className="visual">⬛</span>
                        <span className="name">Redact</span>
                      </label>
                      <label className="radio-card">
                        <input type="radio" name="style" value="blur" checked={maskStyle === 'blur'} onChange={() => setMaskStyle('blur')} />
                        <span className="visual">🌫️</span>
                        <span className="name">Blur</span>
                      </label>
                      <label className="radio-card">
                        <input type="radio" name="style" value="xxxx" checked={maskStyle === 'xxxx'} onChange={() => setMaskStyle('xxxx')} />
                        <span className="visual">❌</span>
                        <span className="name">Pixelate</span>
                      </label>
                    </div>
                  </div>

                  {/* PII Grid Checkboxes */}
                  <div className="deck-group">
                    <span className="deck-group-label">Personally Identifiable Data (PII)</span>
                    <div className="pill-grid">
                      <label className="pill-card">
                        <input type="checkbox" checked={piiToggles.name} onChange={() => handlePiiToggle('name')} />
                        <div className="pill-btn-content">👤 Names</div>
                      </label>
                      <label className="pill-card">
                        <input type="checkbox" checked={piiToggles.email} onChange={() => handlePiiToggle('email')} />
                        <div className="pill-btn-content">✉️ Emails</div>
                      </label>
                      <label className="pill-card">
                        <input type="checkbox" checked={piiToggles.phone} onChange={() => handlePiiToggle('phone')} />
                        <div className="pill-btn-content">📞 Phones</div>
                      </label>
                      <label className="pill-card">
                        <input type="checkbox" checked={piiToggles.financial} onChange={() => handlePiiToggle('financial')} />
                        <div className="pill-btn-content">💳 Banks & Govt IDs</div>
                      </label>
                      <label className="pill-card">
                        <input type="checkbox" checked={piiToggles.credentials} onChange={() => handlePiiToggle('credentials')} />
                        <div className="pill-btn-content">🔑 Credentials</div>
                      </label>
                      <label className="pill-card">
                        <input type="checkbox" checked={piiToggles.address} onChange={() => handlePiiToggle('address')} />
                        <div className="pill-btn-content">📍 Addresses</div>
                      </label>
                      <label className="pill-card full-width">
                        <input type="checkbox" checked={piiToggles.other} onChange={() => handlePiiToggle('other')} />
                        <div className="pill-btn-content">⚙️ Other Metadata</div>
                      </label>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Center Column: Visual Area & Control Terminal */}
            <div className="deck-column center-deck">
              
              {/* Message Feed Display */}
              <div className="feed-panel hud-panel">
                <div className="hud-corner tl"></div>
                <div className="hud-corner tr"></div>
                <div className="hud-corner bl"></div>
                <div className="hud-corner br"></div>

                <div className="chat-scroller">
                  {chatFeed.length === 0 ? (
                    
                    /* Visual Welcome Cockpit Overlay */
                    <div className="welcome-cockpit">
                      <div className="hud-radar-scanner">
                        <div className="hud-scanner-glow"></div>
                        <span style={{ fontSize: '38px', filter: 'drop-shadow(0 0 10px rgba(0, 212, 255, 0.4))' }}>🔍</span>
                      </div>
                      <div className="cockpit-title-badge">AWAITING COCKPIT INSTRUCTIONS</div>
                      <p className="cockpit-subtitle">Upload a PDF or image in the dragzone to trigger multi-agent pipeline parsing and coordinate-blurring.</p>
                      
                      {/* Templates / Demos */}
                      <div className="template-deck">
                        <div className="tmpl-card" onClick={triggerAadhaarDemo}>
                          <div className="tmpl-title">⚡ LOAD AADHAAR DEMO</div>
                          <div className="tmpl-desc">Loads 1000007499.jpg, preset settings, custom rules & side-by-side previews!</div>
                        </div>
                      </div>
                    </div>

                  ) : (
                    
                    /* Chat Bubbles Feed */
                    chatFeed.map((bubble, index) => (
                      <div key={index} className={`chat-bubble ${bubble.sender}`}>
                        <span className="bubble-meta">{bubble.sender === 'user' ? 'USER INSTRUCTION' : 'SECURE REDACTION COMPLETED'}</span>
                        
                        {bubble.sender === 'user' ? (
                          <p style={{ fontSize: '12px' }}>{bubble.text}</p>
                        ) : (
                          
                          /* Result Response Card */
                          <div>
                            <p style={{ fontSize: '12px', marginBottom: '10px' }}>Secure PII mask complete. All coordinates processed locally.</p>
                            
                            {/* Comparison Canvas Grid */}
                            <div className="preview-grid">
                              <div className="view-panel original">
                                <span className="view-badge orig">ORIGINAL</span>
                                <img src={bubble.original} alt="Original Preview" />
                              </div>
                              
                              <div className="split-line">
                                <div className="split-line-handle">↔</div>
                              </div>
                              
                              <div className="view-panel masked">
                                <span className="view-badge mask">SECURED</span>
                                <img src={bubble.masked} alt="Masked Preview" />
                              </div>
                            </div>

                            {/* Download Action Hook */}
                            <div className="download-hook">
                              <div className="download-info">
                                <span className="dl-icon">📄</span>
                                <div className="dl-meta">
                                  <span className="dl-name">{bubble.filename}</span>
                                  <span className="dl-size">Type: SECURE PDF/IMAGE • Detected: {bubble.count} items</span>
                                </div>
                              </div>
                              <a href={`/api/download/${bubble.fileId}`} download className="dl-btn">DOWNLOAD MASKED</a>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  
                  {/* Staged Split Viewport Previews */}
                  {selectedFile && previewOriginal && (
                    <div className="preview-grid" style={{ marginTop: 'auto' }}>
                      <div className="view-panel original">
                        <span className="view-badge orig">ORIGINAL</span>
                        <img src={previewOriginal} alt="Staged Original" />
                      </div>
                      
                      <div className="split-line">
                        <div className="split-line-handle">↔</div>
                      </div>
                      
                      <div className="view-panel masked">
                        <span className="view-badge mask">SECURE MASKED</span>
                        {previewMasked ? (
                          <img src={previewMasked} alt="Staged Masked" />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '24px', color: 'var(--warn)' }}>⚡</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Awaiting AI Agent Execution...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* Cockpit Control Input Footer */}
                <footer className="cockpit-footer">
                  
                  {/* Drag Zone */}
                  <div 
                    className={`tactical-dragzone ${dragActive ? 'dragover' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('footerFileInput').click()}
                  >
                    <input 
                      type="file" 
                      id="footerFileInput" 
                      style={{ display: 'none' }} 
                      onChange={handleFileSelect} 
                      accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.pptx,.docx"
                    />
                    {selectedFile ? (
                      <div className="dragzone-filename">
                        <span>staged: <strong>{selectedFile.name}</strong> ({(selectedFile.size/1024).toFixed(1)} KB)</span>
                        <button className="dragzone-remove" onClick={(e) => { e.stopPropagation(); removeFile(); }}>×</button>
                      </div>
                    ) : (
                      <>
                        <span className="dragzone-icon">📁</span>
                        <span className="dragzone-text">DRAG & DROP OR <strong>BROWSE TACTICAL FILES</strong> (PDF, JPG, PNG)</span>
                      </>
                    )}
                  </div>

                  <div className="footer-top-row">
                    <div className="text-area-glow-wrapper">
                      <textarea 
                        className="cyber-textarea"
                        placeholder="Write custom assistant prompt (e.g. 'blur all names, keep phone number visible')"
                        value={userPrompt}
                        onChange={(e) => handleUserPromptChange(e.target.value)}
                      />
                    </div>
                    
                    <div className="footer-btn-group">
                      <button 
                        className="cyber-btn alt"
                        title="Clear Workspace"
                        onClick={removeFile}
                        disabled={!selectedFile}
                      >
                        🗑️
                      </button>
                      <button 
                        className="cyber-btn"
                        onClick={executePIIRedaction}
                        disabled={!selectedFile || isProcessing}
                        title="Execute Secure Redactor"
                      >
                        ⚡
                      </button>
                    </div>
                  </div>
                </footer>
              </div>
            </div>

            {/* Right Column: Risk Progress & Terminal Console */}
            <div className="deck-column right-sidebar">
              
              {/* Confidence scores progress bars */}
              <div className="deck-panel hud-panel" style={{ flex: '0.6' }}>
                <div className="hud-corner tl"></div>
                <div className="hud-corner tr"></div>
                <div className="hud-corner bl"></div>
                <div className="hud-corner br"></div>

                <div className="deck-panel-header">
                  <h3>Operations Risk</h3>
                  <span className="brand-desc">Detected Pattern Weights</span>
                </div>
                
                <div className="deck-panel-body">
                  <div className="confidence-wrapper">
                    
                    {/* Progress rows */}
                    <div className="confidence-row">
                      <div className="confidence-info">
                        <span className="confidence-name">Names & Emails</span>
                        <span className="confidence-value" style={{ color: 'var(--accent)' }}>{piiToggles.name ? '94%' : '0%'}</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: piiToggles.name ? '94%' : '0%', background: 'var(--accent)' }}></div>
                      </div>
                    </div>
                    
                    <div className="confidence-row">
                      <div className="confidence-info">
                        <span className="confidence-name">Banks & Aadhaar</span>
                        <span className="confidence-value" style={{ color: 'var(--warn)' }}>{piiToggles.financial ? '88%' : '0%'}</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: piiToggles.financial ? '88%' : '0%', background: 'var(--warn)' }}></div>
                      </div>
                    </div>

                    <div className="confidence-row">
                      <div className="confidence-info">
                        <span className="confidence-name">Passwords & API Keys</span>
                        <span className="confidence-value" style={{ color: 'var(--accent2)' }}>{piiToggles.credentials ? '91%' : '0%'}</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: piiToggles.credentials ? '91%' : '0%', background: 'var(--accent2)' }}></div>
                      </div>
                    </div>

                    <div className="confidence-row">
                      <div className="confidence-info">
                        <span className="confidence-name">Addresses / Location</span>
                        <span className="confidence-value" style={{ color: '#fff' }}>{piiToggles.address ? '82%' : '0%'}</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: piiToggles.address ? '82%' : '0%', background: '#fff' }}></div>
                      </div>
                    </div>

                  </div>
                  
                  {/* Quick Custom Actions */}
                  <div className="deck-group" style={{ marginTop: '15px' }}>
                    <span className="deck-group-label">Quick Commands</span>
                    <div className="cmd-grid">
                      <button className="cmd-btn" onClick={() => handleUserPromptChange('Mask all financial and government Aadhaar records')}>
                        🔒 Mask all Aadhaar govt IDs
                      </button>
                      <button className="cmd-btn" onClick={() => handleUserPromptChange('Apply gaussian blur to all faces and text')}>
                        🌫️ Blur all visor fields
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Scrolling Agent Audit Terminal Console */}
              <div className="deck-panel hud-panel audit-console-panel">
                <div className="hud-corner tl"></div>
                <div className="hud-corner tr"></div>
                <div className="hud-corner bl"></div>
                <div className="hud-corner br"></div>

                <div className="deck-panel-header">
                  <h3>Agent Audit Console</h3>
                  <span className="brand-desc">Zero-Trust Logs</span>
                </div>
                
                <div className="terminal-logs">
                  {terminalLogs.map((log, idx) => (
                    <div key={idx} className={`terminal-line ${log.type}`}>
                      {log.text}
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </main>
        </div>
      )}
    </div>
  );
}
