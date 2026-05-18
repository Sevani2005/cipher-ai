// ----------------------------------------------------
// CIPHER AI - FRONTEND INTERACTIVE CONTROLLER
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // State management
    let currentFile = null;
    let zoomLevel = 1.0;

    // DOM Elements
    const apiStatusBadge = document.getElementById('apiStatusBadge');
    
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileLoadedState = document.getElementById('fileLoadedState');
    const loadedFileName = document.getElementById('loadedFileName');
    const loadedFileSize = document.getElementById('loadedFileSize');
    const loadedFileIcon = document.getElementById('loadedFileIcon');
    const removeFileBtn = document.getElementById('removeFileBtn');
    
    const maskSettingsForm = document.getElementById('maskSettingsForm');
    const pdfModeGroup = document.getElementById('pdfModeGroup');
    const executeMaskingBtn = document.getElementById('executeMaskingBtn');
    
    const canvasViewport = document.getElementById('canvasViewport');
    const viewportIdle = document.getElementById('viewportIdle');
    const splitPreviewContainer = document.getElementById('splitPreviewContainer');
    const originalPreviewImg = document.getElementById('originalPreviewImg');
    const maskedPreviewImg = document.getElementById('maskedPreviewImg');
    const processingOverlay = document.getElementById('processingOverlay');
    const canvasActions = document.getElementById('canvasActions');
    
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const resetZoomBtn = document.getElementById('resetZoomBtn');
    
    const terminalOutput = document.getElementById('terminalOutput');
    const agentStatus = document.getElementById('agentStatus');
    
    const downloadContainer = document.getElementById('downloadContainer');
    const downloadFileMeta = document.getElementById('downloadFileMeta');
    const downloadLink = document.getElementById('downloadLink');

    // 1. API KEY HANDLING & MULTI-PROVIDER SUPPORT
    const apiProviderSelect = document.getElementById('apiProviderSelect');

    // Glassmorphic Premium Toast Notification Helper
    const showToast = (title, message, type = 'error') => {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        
        let icon = '❌';
        if (type === 'success') icon = '🟢';
        if (type === 'warning') icon = '⚠️';
        if (type === 'info') icon = '💡';
        
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Dynamic Slide-in transition
        setTimeout(() => {
            toast.classList.add('show');
        }, 50);
        
        // Auto dismiss after 5.5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 450);
        }, 5500);
    };

    const updateProviderUI = () => {
        const provider = apiProviderSelect.value;
        localStorage.setItem('cipher_api_provider', provider);
        
        if (provider === 'local') {
            // Set Badge to Local Rules Mode (Amber)
            apiStatusBadge.querySelector('.status-dot').style.backgroundColor = 'var(--accent-peach)';
            apiStatusBadge.querySelector('.status-dot').style.boxShadow = '0 0 8px var(--accent-peach)';
            apiStatusBadge.querySelector('.status-text').textContent = 'Local Rules Mode';
            apiStatusBadge.style.borderColor = 'rgba(249, 226, 175, 0.4)';
            apiStatusBadge.style.background = 'rgba(249, 226, 175, 0.05)';
        } else if (provider === 'groq') {
            // Set Badge to Active Mode (Green)
            apiStatusBadge.querySelector('.status-dot').style.backgroundColor = 'var(--accent-green)';
            apiStatusBadge.querySelector('.status-dot').style.boxShadow = '0 0 8px var(--accent-green)';
            apiStatusBadge.querySelector('.status-text').textContent = 'Groq Cloud Active';
            apiStatusBadge.style.borderColor = 'rgba(166, 227, 161, 0.4)';
            apiStatusBadge.style.background = 'rgba(166, 227, 161, 0.05)';
        } else if (provider === 'gemini') {
            // Set Badge to Active Mode (Green)
            apiStatusBadge.querySelector('.status-dot').style.backgroundColor = 'var(--accent-green)';
            apiStatusBadge.querySelector('.status-dot').style.boxShadow = '0 0 8px var(--accent-green)';
            apiStatusBadge.querySelector('.status-text').textContent = 'Gemini AI Active';
            apiStatusBadge.style.borderColor = 'rgba(166, 227, 161, 0.4)';
            apiStatusBadge.style.background = 'rgba(166, 227, 161, 0.05)';
        }
    };

    apiProviderSelect.addEventListener('change', updateProviderUI);

    // Initialize provider configuration on load
    const savedProvider = localStorage.getItem('cipher_api_provider') || 'local';
    apiProviderSelect.value = savedProvider;
    updateProviderUI();

    // 2. LOGGING UTILITY
    const addLogLine = (message, type = 'info') => {
        const line = document.createElement('div');
        line.className = `log-line type-${type}`;
        line.textContent = `> ${message}`;
        terminalOutput.appendChild(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    };

    const clearLogs = () => {
        terminalOutput.innerHTML = '';
    };

    // 3. FILE SELECTION & UPLOAD HANDLERS
    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const getFileIconStr = (ext) => {
        if (ext === 'pdf') return '📕';
        if (['pptx', 'ppt'].includes(ext)) return '📙';
        if (['docx', 'doc'].includes(ext)) return '📘';
        if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return '🖼️';
        return '📄';
    };

    const handleFile = (file) => {
        if (!file) return;
        currentFile = file;
        const ext = file.name.split('.').pop().toLowerCase();
        
        // Update loaded pill in UI
        loadedFileName.textContent = file.name;
        loadedFileSize.textContent = formatBytes(file.size);
        loadedFileIcon.textContent = getFileIconStr(ext);
        fileLoadedState.style.display = 'flex';
        
        // Show PDF specific switches
        if (ext === 'pdf') {
            pdfModeGroup.style.display = 'flex';
            addLogLine(`File loaded: ${file.name}. Configured for Native Vector Redaction.`, 'info');
            showToast('Document Loaded', 'PDF loaded successfully. Select Vector or Page Flattening Mode!', 'info');
        } else {
            pdfModeGroup.style.display = 'none';
            addLogLine(`File loaded: ${file.name}. Format supported.`, 'info');
            
            // Image Auto-Setup
            const isImage = ['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext);
            if (isImage) {
                const currentProvider = apiProviderSelect.value;
                if (currentProvider !== 'gemini') {
                    apiProviderSelect.value = 'gemini';
                    updateProviderUI();
                    addLogLine(`💡 Auto-configured engine: Switched to 'Google Gemini' for image processing.`, 'success');
                    addLogLine(`Gemini scans the image visually to find exactly where names and sensitive items are!`, 'info');
                    showToast('Gemini Vision Activated', 'Images require visual coordinate blurs. Switched provider to Gemini automatically!', 'info');
                } else {
                    showToast('Image Loaded', 'Ready for visual spatial blurs and redactions!', 'info');
                }
            } else {
                showToast('File Loaded', `${ext.toUpperCase()} file loaded successfully!`, 'info');
            }
        }

        // Enable trigger button
        executeMaskingBtn.disabled = false;
        
        // Reset previews
        resetCanvas();
    };

    const resetCanvas = () => {
        viewportIdle.style.display = 'flex';
        splitPreviewContainer.style.display = 'none';
        canvasActions.style.display = 'none';
        downloadContainer.style.display = 'none';
        zoomLevel = 1.0;
        applyZoom();
    };

    // Uploader click trigger
    dropZone.addEventListener('click', (e) => {
        if (e.target !== removeFileBtn && !removeFileBtn.contains(e.target)) {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Drag-and-Drop dragover states
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    removeFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentFile = null;
        fileInput.value = '';
        fileLoadedState.style.display = 'none';
        executeMaskingBtn.disabled = true;
        addLogLine('File removed.', 'warning');
        resetCanvas();
    });

    // 4. MASKING EXECUTION (AJAX SEND)
    executeMaskingBtn.addEventListener('click', async () => {
        if (!currentFile) {
            addLogLine('Cannot execute: No file selected.', 'error');
            return;
        }

        const provider = apiProviderSelect.value;
        const storageKey = provider === 'groq' ? 'cipher_groq_api_key' : 'cipher_gemini_api_key';
        const apiKey = localStorage.getItem(storageKey) || '';

        // Toggle state in UI
        agentStatus.textContent = 'RUNNING';
        agentStatus.style.background = 'rgba(243, 139, 168, 0.15)';
        agentStatus.style.color = '#f38ba8';
        
        processingOverlay.style.display = 'flex';
        viewportIdle.style.display = 'none';
        splitPreviewContainer.style.display = 'none';
        canvasActions.style.display = 'none';
        downloadContainer.style.display = 'none';
        executeMaskingBtn.disabled = true;

        clearLogs();
        addLogLine('Agent activated. Initiating document structure parsing...', 'agent');
        addLogLine(`Target File: ${currentFile.name} (${formatBytes(currentFile.size)})`, 'info');

        // Compile Options Form Data
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('api_provider', provider);
        formData.append('api_key', apiKey);

        // Append style
        const styleSelected = document.querySelector('input[name="style"]:checked').value;
        formData.append('style', styleSelected);

        // Append pdf mode
        const pdfModeSelected = document.querySelector('input[name="pdf_mode"]:checked')?.value || 'vector';
        formData.append('pdf_mode', pdfModeSelected);

        // Append checkboxes
        formData.append('name', document.getElementById('chkName').checked);
        formData.append('email', document.getElementById('chkEmail').checked);
        formData.append('phone', document.getElementById('chkPhone').checked);
        formData.append('financial', document.getElementById('chkFinancial').checked);
        formData.append('credentials', document.getElementById('chkCredentials').checked);
        formData.append('address', document.getElementById('chkAddress').checked);
        formData.append('other', document.getElementById('chkOther').checked);

        // Append custom rules
        formData.append('custom_keywords', document.getElementById('customKeywords').value);
        formData.append('custom_regex', document.getElementById('customRegex').value);
        formData.append('user_prompt', document.getElementById('userPrompt').value);

        try {
            // Post payload to backend
            const response = await fetch('/api/mask', {
                method: 'POST',
                headers: {
                    'X-API-Provider': provider,
                    'X-API-Key': apiKey
                },
                body: formData
            });

            const result = await response.json();
            processingOverlay.style.display = 'none';
            executeMaskingBtn.disabled = false;

            if (result.success) {
                agentStatus.textContent = 'COMPLETED';
                agentStatus.style.background = 'rgba(166, 227, 161, 0.15)';
                agentStatus.style.color = '#a6e3a1';

                // Display returned engine logs
                if (result.logs && result.logs.length > 0) {
                    result.logs.forEach(log => {
                        addLogLine(log.message, log.type);
                    });
                }
                
                addLogLine('Re-assembling document layout and injecting masking elements...', 'info');
                addLogLine('Document processed successfully and reconstructed!', 'success');
                showToast('Redaction Successful', 'Document has been processed and reconstructed securely!', 'success');

                // Render side-by-side comparison images
                const timestamp = new Date().getTime();
                originalPreviewImg.src = `${result.original_url}?t=${timestamp}`;
                maskedPreviewImg.src = `${result.masked_url}?t=${timestamp}`;
                
                // Show panels
                splitPreviewContainer.style.display = 'grid';
                canvasActions.style.display = 'flex';
                
                // Enable Download
                downloadContainer.style.display = 'block';
                downloadFileMeta.textContent = `Reconstructed safe document: ${result.filename}`;
                downloadLink.href = result.download_url;

            } else {
                agentStatus.textContent = 'FAILED';
                agentStatus.style.background = 'rgba(243, 139, 168, 0.15)';
                agentStatus.style.color = '#f38ba8';
                
                // Display error logs if present
                if (result.logs && result.logs.length > 0) {
                    result.logs.forEach(log => {
                        addLogLine(log.message, log.type);
                    });
                }
                addLogLine(`Execution Error: ${result.error}`, 'error');
                viewportIdle.style.display = 'flex';
                showToast('Redaction Failed', result.error, 'error');
            }

        } catch (error) {
            processingOverlay.style.display = 'none';
            executeMaskingBtn.disabled = false;
            agentStatus.textContent = 'FAILED';
            agentStatus.style.background = 'rgba(243, 139, 168, 0.15)';
            agentStatus.style.color = '#f38ba8';
            
            addLogLine(`Network / Server Error: ${error.message}`, 'error');
            viewportIdle.style.display = 'flex';
            showToast('Connection Error', `A connection or system error occurred: ${error.message}`, 'error');
        }
    });

    // 5. ZOOM PREVIEW UTILS
    const applyZoom = () => {
        originalPreviewImg.style.transform = `scale(${zoomLevel})`;
        maskedPreviewImg.style.transform = `scale(${zoomLevel})`;
    };

    zoomInBtn.addEventListener('click', () => {
        if (zoomLevel < 3.0) {
            zoomLevel += 0.2;
            applyZoom();
            addLogLine(`Canvas zoom increased to ${Math.round(zoomLevel * 100)}%`, 'info');
        }
    });

    zoomOutBtn.addEventListener('click', () => {
        if (zoomLevel > 0.6) {
            zoomLevel -= 0.2;
            applyZoom();
            addLogLine(`Canvas zoom decreased to ${Math.round(zoomLevel * 100)}%`, 'info');
        }
    });

    resetZoomBtn.addEventListener('click', () => {
        zoomLevel = 1.0;
        applyZoom();
        addLogLine('Canvas zoom reset to default (100%)', 'info');
    });

    // Chip selection handler for prompt-based inputs
    document.querySelectorAll('.prompt-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const promptVal = chip.getAttribute('data-prompt');
            const userPromptInput = document.getElementById('userPrompt');
            userPromptInput.value = promptVal;
            showToast('Instruction Loaded', `Prompt updated: "${promptVal}"`, 'info');
        });
    });
});
