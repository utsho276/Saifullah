// ==UserScript==
// @name         MicroWorkers new update v4 - Pro Edition v2
// @namespace    http://tampermonkey.net/
// @version      8.1
// @description  Universal panel with advanced link manager, dual sound system, all toggles integrated
// @author       Weird Utsho & Mehedi Hasan Hridoy
// @match        https://ttv.microworkers.com/dotask/info/*
// @match        https://taskv2.microworkers.com/dotask/info/*
// @match        https://ttv.microworkers.com/dotask/submitProof/*
// @match        https://www.microworkers.com/login.php
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ---- AUTHORIZATION FUNCTION ----
    var authorizedUsername = "saiful";
    var authorizedPassword = "2010";

    function promptForAuthorization() {
        var username = prompt("Enter your short name:");
        var password = prompt("Enter your 4 digit pin:");

        if (username === authorizedUsername && password === authorizedPassword) {
            alert("Authorization successful. You are authorized. Unauthorized users account will be terminated.");
            return true;
        } else {
            alert("Authorization failed. You are not authorized. Unauthorized users account will be terminated.");
            return false;
        }
    }

    if (window.location.href.includes("login.php")) {
        while (!promptForAuthorization()) {
            // Keep prompting for authorization
        }
        return;
    }

    // ---- Check if we should show panel ----
    const isTaskV2InfoPage = window.location.href.includes('taskv2.microworkers.com/dotask/info/');

    if (isTaskV2InfoPage) {
        const taskSoundEnabled = localStorage.getItem('mwTaskSound') !== 'false';

        if (taskSoundEnabled) {
            setTimeout(function() {
                const audio = new Audio('https://audio.jukehost.co.uk/rGvilh1n3p5lbl74Mg2UbFLGqfD2GkSB');
                audio.volume = 0.7;
                audio.play().catch(e => {
                    console.log('Task accept sound play failed:', e);
                    setTimeout(() => {
                        audio.play().catch(e2 => console.log('Retry also failed:', e2));
                    }, 500);
                });
                console.log('🎵 Task accepted - playing sound on taskv2 page');
            }, 1500);
        }
        return;
    }

    if (sessionStorage.getItem('mwJustSwitched') === 'true') {
        sessionStorage.removeItem('mwJustSwitched');
        console.log('Preventing reload loop after switch');
    }

    const isInfoPage = window.location.href.includes('/dotask/info/');
    const isSubmitProofPage = window.location.href.includes('/dotask/submitProof/');

    // Global variables for link manager
    let originalCampaignId = getCurrentCampaignId();
    let isFormModified = false;

    // ---- Create main panel with premium dark theme ----
    const mainBar = document.createElement('div');
    mainBar.id = 'micro-workers-universal-panel';
    document.body.appendChild(mainBar);

    const savedPos = JSON.parse(localStorage.getItem('mwUniversalPanelPos') || '{}');
    if (savedPos.top && savedPos.left) {
        mainBar.style.top = savedPos.top;
        mainBar.style.left = savedPos.left;
    } else {
        mainBar.style.top = '20px';
        mainBar.style.right = '20px';
    }

    const header = document.createElement('div');
    header.id = 'panel-header';
    header.innerHTML = `
        <span class="drag-icon">●</span>
        <span style="flex:1; font-weight:bold; font-size:13px;">
            <span style="color:#ff3b30;">micro</span><span style="color:#4aa3ff;">Workers</span> PRO
        </span>
        <button id="toggleSoundBtn" class="header-btn" title="Toggle Sound">🔊</button>
        <button id="taskSoundBtn" class="header-btn" title="Task Accept Sound">🎵</button>
        <button id="themeToggleBtn" class="header-btn" title="Toggle Theme">◐</button>
        <button id="minimizeBtn" class="header-btn" title="Minimize">–</button>
    `;
    mainBar.appendChild(header);

    const content = document.createElement('div');
    content.id = 'panel-content';
    mainBar.appendChild(content);

    // ---- Premium Dark Theme Styles with WIDER UI ----
    const barStyle = document.createElement('style');
    barStyle.innerHTML = `
        #micro-workers-universal-panel {
            position: fixed;
            z-index: 99999;
            background: #0a0a0a;
            border: 1px solid #1a1a1a;
            border-radius: 10px;
            width: 380px;  /* Increased width */
            box-shadow:
                0 20px 25px -5px rgba(0, 0, 0, 0.8),
                0 10px 10px -5px rgba(0, 0, 0, 0.6),
                inset 0 1px 0 rgba(255, 255, 255, 0.02);
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            user-select: none;
            color: #ffffff;
        }

        #panel-header {
            cursor: move;
            padding: 10px 12px;
            background: #111111;
            color: #9ca3af;
            font-weight: bold;
            border-radius: 9px 9px 0 0;
            user-select: none;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #1a1a1a;
            font-size: 12px;
        }

        .drag-icon {
            font-size: 10px;
            color: #00ff88;
            text-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
            margin-right: 8px;
        }

        .header-btn {
            background: transparent;
            border: none;
            cursor: pointer;
            font-size: 16px;
            padding: 4px 8px;
            margin: 0 2px;
            transition: all 0.2s ease;
            color: #6b7280;
            border-radius: 4px;
        }

        .header-btn:hover {
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
        }

        .header-btn.active {
            color: #00ff88;
            text-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
        }

        .header-btn.sound-active {
            color: #4aa3ff;
            text-shadow: 0 0 8px rgba(74, 163, 255, 0.5);
        }

        #panel-content {
            padding: 12px;
            background: #0a0a0a;
            border-radius: 0 0 9px 9px;
            max-height: none;  /* No max height - show everything */
            overflow-y: visible;  /* No scroll */
        }

        .link-manager-section {
            margin-bottom: 12px;
            background: #111111;
            border: 1px solid #1f2937;
            border-radius: 6px;
            padding: 10px;
        }

        .section-title {
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 11px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .link-input-group {
            display: flex;
            gap: 6px;
            margin-bottom: 8px;
        }

        .link-input {
            flex: 1;
            padding: 8px 10px;
            border: 1px solid #1f2937;
            border-radius: 6px;
            background: #0a0a0a;
            color: #ffffff;
            font-size: 12px;
            transition: all 0.2s ease;
            outline: none;
        }

        .link-input::placeholder {
            color: #4b5563;
            font-size: 11px;
        }

        .link-input:focus {
            border-color: #00ff88;
            box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.1);
        }

        .save-link-btn,
        .paste-btn,
        .clear-link-btn {
            padding: 8px 12px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
            transition: all 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .save-link-btn {
            background: #00ff88;
            color: #000000;
        }

        .save-link-btn:hover {
            background: #00cc6a;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
        }

        .paste-btn {
            background: #1f2937;
            color: #9ca3af;
            min-width: 36px;
            padding: 8px;
        }

        .paste-btn:hover {
            background: #374151;
            color: #ffffff;
        }

        .clear-link-btn {
            background: #1f2937;
            color: #ef4444;
            width: 100%;
            margin-top: 6px;
        }

        .clear-link-btn:hover {
            background: #ef4444;
            color: #ffffff;
        }

        .status-container {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-top: 8px;
        }

        .link-status {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            padding: 6px 8px;
            border-radius: 4px;
            background: #0a0a0a;
            transition: all 0.2s ease;
        }

        .status-icon {
            font-size: 10px;
        }

        .status-text {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #9ca3af;
        }

        .original-link .status-icon {
            color: #6b7280;
        }

        .current-link .status-icon {
            color: #fbbf24;
            text-shadow: 0 0 6px rgba(251, 191, 36, 0.5);
        }

        .pending-link .status-icon {
            color: #6b7280;
        }

        .pending-link.active {
            background: rgba(0, 255, 136, 0.1);
        }

        .pending-link.active .status-icon {
            color: #00ff88;
            text-shadow: 0 0 6px rgba(0, 255, 136, 0.5);
        }

        .pending-link.active .status-text {
            color: #00ff88;
        }

        .mode-indicator {
            background: #1f2937;
            color: #9ca3af;
            padding: 8px;
            border-radius: 6px;
            font-size: 11px;
            text-align: center;
            font-weight: bold;
            margin-top: 8px;
            transition: all 0.3s ease;
        }

        .mode-indicator.active {
            background: #00ff88;
            color: #000;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }

        .toggles-section {
            margin: 10px 0;
            padding: 10px;
            background: #111111;
            border: 1px solid #1f2937;
            border-radius: 6px;
        }

        .toggles-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;  /* 3 columns for better fit */
            gap: 8px;
        }

        .toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 5px 4px;
            border-radius: 4px;
            background: #0a0a0a;
            border: 1px solid #1a1a1a;
        }

        .toggle-label {
            color: #9ca3af;
            font-weight: 500;
            font-size: 10px;
            flex: 1;
            padding-right: 4px;
        }

        .toggle-switch {
            width: 32px;
            height: 16px;
            background: #1f2937;
            border-radius: 12px;
            cursor: pointer;
            position: relative;
            transition: all 0.2s ease;
            overflow: hidden;
            border: 1px solid #374151;
            flex-shrink: 0;
        }

        .toggle-slider {
            width: 12px;
            height: 12px;
            background: #6b7280;
            border-radius: 50%;
            position: absolute;
            top: 2px;
            left: 2px;
            transition: all 0.2s ease;
        }

        .toggle-switch.active {
            background: #00ff88;
            border-color: #00cc6a;
        }

        .toggle-switch.active .toggle-slider {
            transform: translateX(16px);
            background: #000;
        }

        .toggle-row.active {
            background: rgba(0, 255, 136, 0.05);
            border-color: #00ff88;
        }

        .toggle-row.active .toggle-label {
            color: #00ff88;
            font-weight: bold;
        }

        .action-form {
            margin: 12px 0;
            text-align: center;
        }

        .action-button {
            color: #000;
            padding: 10px 16px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: bold;
            width: 100%;
            transition: all 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .accept-start-button {
            background: linear-gradient(135deg, #00ff88, #00cc6a);
            box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
        }

        .accept-start-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(0, 255, 136, 0.4);
        }

        .dotask-again-button {
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
        }

        .dotask-again-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(251, 191, 36, 0.4);
        }

        .action-button:disabled {
            background: #374151;
            color: #6b7280;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .developer-info {
            margin-top: 12px;
            padding: 10px;
            background: #111111;
            border: 1px solid #1f2937;
            border-radius: 6px;
            font-size: 11px;
            text-align: center;
        }

        .developer-info h4 {
            margin: 0 0 6px 0;
            color: #9ca3af;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .developer-info p {
            margin: 4px 0;
            color: #6b7280;
            font-size: 11px;
            line-height: 1.4;
        }

        .developer-info a {
            color: #00ff88;
            text-decoration: none;
            display: inline-block;
            margin: 0 8px;
            font-size: 11px;
        }

        .developer-info a:hover {
            text-decoration: underline;
            color: #00cc6a;
        }

        /* Light Theme */
        .light-theme #micro-workers-universal-panel {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            box-shadow:
                0 20px 25px -5px rgba(0, 0, 0, 0.1),
                0 10px 10px -5px rgba(0, 0, 0, 0.04);
            color: #111827;
        }

        .light-theme #panel-header {
            background: #f9fafb;
            color: #111827;
            border-bottom-color: #e5e7eb;
        }

        .light-theme .drag-icon {
            color: #10b981;
            text-shadow: none;
        }

        .light-theme #panel-content {
            background: #ffffff;
        }

        .light-theme .link-manager-section,
        .light-theme .toggles-section {
            background: #f9fafb;
            border-color: #e5e7eb;
        }

        .light-theme .link-input {
            background: #ffffff;
            border-color: #d1d5db;
            color: #111827;
        }

        .light-theme .link-input:focus {
            border-color: #10b981;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .light-theme .toggle-row {
            background: #ffffff;
            border-color: #e5e7eb;
        }

        .light-theme .toggle-switch {
            background: #e5e7eb;
            border-color: #d1d5db;
        }

        .light-theme .toggle-slider {
            background: #ffffff;
        }

        .light-theme .toggle-switch.active {
            background: #10b981;
            border-color: #059669;
        }

        .light-theme .toggle-row.active {
            background: rgba(16, 185, 129, 0.05);
            border-color: #10b981;
        }

        .light-theme .toggle-row.active .toggle-label {
            color: #10b981;
        }

        .light-theme .section-title,
        .light-theme .toggle-label {
            color: #6b7280;
        }

        .light-theme .developer-info {
            background: #f9fafb;
            border-color: #e5e7eb;
        }

        .light-theme .developer-info h4 {
            color: #111827;
        }

        .light-theme .developer-info p {
            color: #6b7280;
        }

        .light-theme .developer-info a {
            color: #10b981;
        }

        .light-theme .developer-info a:hover {
            color: #059669;
        }

        .light-theme .save-link-btn {
            background: #10b981;
            color: #ffffff;
        }

        .light-theme .save-link-btn:hover {
            background: #059669;
        }

        .light-theme .paste-btn {
            background: #f3f4f6;
            color: #6b7280;
        }

        .light-theme .clear-link-btn {
            background: #f3f4f6;
            color: #ef4444;
        }

        .light-theme .clear-link-btn:hover {
            background: #ef4444;
            color: #ffffff;
        }

        .light-theme .mode-indicator {
            background: #f3f4f6;
            color: #6b7280;
        }

        .light-theme .mode-indicator.active {
            background: #10b981;
            color: #ffffff;
        }

        .light-theme .link-status {
            background: #ffffff;
        }

        .light-theme .status-text {
            color: #6b7280;
        }

        .light-theme .header-btn {
            color: #6b7280;
        }

        .light-theme .header-btn:hover {
            background: rgba(0, 0, 0, 0.05);
            color: #111827;
        }

        .light-theme .header-btn.active {
            color: #10b981;
            text-shadow: none;
        }

        .light-theme .header-btn.sound-active {
            color: #3b82f6;
            text-shadow: none;
        }

        #panel-content.minimized {
            display: none;
        }

        .mw-notification {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 100002;
            font-weight: 600;
            font-size: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translate(-50%, -60%);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%);
            }
        }
    `;
    document.head.appendChild(barStyle);

    // ---- Drag & Drop logic ----
    let isDragging = false, offsetX = 0, offsetY = 0;

    header.addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('header-btn')) return;
        isDragging = true;
        offsetX = e.clientX - mainBar.offsetLeft;
        offsetY = e.clientY - mainBar.offsetTop;
        e.stopPropagation();
    });

    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            mainBar.style.left = (e.clientX - offsetX) + 'px';
            mainBar.style.top = (e.clientY - offsetY) + 'px';
            mainBar.style.right = 'auto';
        }
    });

    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            localStorage.setItem('mwUniversalPanelPos', JSON.stringify({
                top: mainBar.style.top,
                left: mainBar.style.left
            }));
        }
    });

    // ---- Minimize/Maximize functionality ----
    const minimizeBtn = document.getElementById('minimizeBtn');
    const savedMinimized = localStorage.getItem('mwUniversalPanelMinimized');

    if (savedMinimized === 'true') {
        content.classList.add('minimized');
        minimizeBtn.textContent = '+';
    }

    minimizeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        content.classList.toggle('minimized');
        minimizeBtn.textContent = content.classList.contains('minimized') ? '+' : '–';
        localStorage.setItem('mwUniversalPanelMinimized', content.classList.contains('minimized').toString());
    });

    // ---- Dual Sound System ----
    const toggleSoundBtn = document.getElementById('toggleSoundBtn');
    const taskSoundBtn = document.getElementById('taskSoundBtn');

    const savedToggleSound = localStorage.getItem('mwToggleSound');
    const savedTaskSound = localStorage.getItem('mwTaskSound');

    const toggleSoundState = savedToggleSound !== 'false';
    const taskSoundState = savedTaskSound !== 'false';

    if (toggleSoundState) {
        toggleSoundBtn.classList.add('active');
        toggleSoundBtn.textContent = '🔊';
    } else {
        toggleSoundBtn.textContent = '🔇';
    }

    if (taskSoundState) {
        taskSoundBtn.classList.add('sound-active');
        taskSoundBtn.textContent = '🎵';
    } else {
        taskSoundBtn.textContent = '🔇';
    }

    toggleSoundBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isToggleSoundOn = toggleSoundBtn.classList.toggle('active');
        toggleSoundBtn.textContent = isToggleSoundOn ? '🔊' : '🔇';
        localStorage.setItem('mwToggleSound', isToggleSoundOn.toString());
    });

    taskSoundBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isTaskSoundOn = taskSoundBtn.classList.toggle('sound-active');
        taskSoundBtn.textContent = isTaskSoundOn ? '🎵' : '🔇';
        localStorage.setItem('mwTaskSound', isTaskSoundOn.toString());
    });

    function playToggleSound() {
        const isToggleSoundOn = toggleSoundBtn.classList.contains('active');

        if (isToggleSoundOn) {
            try {
                const audio = new Audio('https://audio.jukehost.co.uk/BtyaLI2d3javMOZvZ9xELg9S0h2Prhs0');
                audio.volume = 0.7;
                audio.play().catch(e => console.log('Toggle sound play failed:', e));
            } catch(e) {
                console.log('Toggle sound error:', e);
            }
        }
    }

    // ---- Theme Toggle ----
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const savedTheme = localStorage.getItem('mwUniversalPanelTheme');

    if (savedTheme === 'light') {
        mainBar.classList.add('light-theme');
        themeToggleBtn.textContent = '◑';
    }

    themeToggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        mainBar.classList.toggle('light-theme');
        const isLight = mainBar.classList.contains('light-theme');
        themeToggleBtn.textContent = isLight ? '◑' : '◐';
        localStorage.setItem('mwUniversalPanelTheme', isLight ? 'light' : 'dark');
    });

    // ---- ADVANCED LINK MANAGER FROM SCRIPT 3 ----
    function getCurrentCampaignId() {
        const url = window.location.href;
        const match = url.match(/\/dotask\/(?:info|submitProof)\/([^\/\?]+)/);
        return match ? match[1] : 'Unknown';
    }

    function checkAndCleanupSavedLink() {
        const savedCampaignId = localStorage.getItem('mwPendingCampaignId');
        const savedLink = localStorage.getItem('mwPendingLink');
        const savedForPage = localStorage.getItem('mwSavedForPage');

        if (savedCampaignId) {
            if (savedCampaignId === originalCampaignId) {
                console.log('🔄 Arrived at saved link page, clearing saved data');
                clearAllSavedData();
                return;
            }

            if (savedForPage && savedForPage !== originalCampaignId) {
                console.log('🔄 Different job page detected, clearing old saved link');
                clearAllSavedData();
                return;
            }
        }
    }

    function clearAllSavedData() {
        localStorage.removeItem('mwPendingLink');
        localStorage.removeItem('mwPendingCampaignId');
        localStorage.removeItem('mwSavedForPage');
        sessionStorage.removeItem('mwPendingRedirect');
        sessionStorage.removeItem('mwSubmitTime');
    }

    function createLinkManager() {
        if (isInfoPage) {
            checkAndCleanupSavedLink();
        }

        const linkManagerSection = document.createElement('div');
        linkManagerSection.className = 'link-manager-section';
        linkManagerSection.innerHTML = `
            <div class="section-title">
                <span>🔗</span>
                <span>LINK MANAGER PRO</span>
            </div>
            <div class="link-input-group">
                <input type="text" class="link-input" placeholder="Paste MW link here...">
                <button class="paste-btn" title="Paste from clipboard">📋</button>
                <button class="save-link-btn">SAVE</button>
            </div>
            <div class="status-container">
                <div class="link-status original-link" id="originalLinkStatus">
                    <span class="status-icon">📍</span>
                    <span class="status-text">Original: ${originalCampaignId}</span>
                </div>
                <div class="link-status current-link" id="currentLinkStatus">
                    <span class="status-icon">▶</span>
                    <span class="status-text">Form ID: ${originalCampaignId}</span>
                </div>
                <div class="link-status pending-link" id="pendingLinkStatus">
                    <span class="status-icon">⏳</span>
                    <span class="status-text">Next: None</span>
                </div>
            </div>
            <div class="mode-indicator" id="modeIndicator">
                ✅ NORMAL MODE
            </div>
            <button class="clear-link-btn" title="Clear saved link and restore original">CLEAR SAVED LINK</button>
        `;

        content.insertBefore(linkManagerSection, content.firstChild);

        const linkInput = linkManagerSection.querySelector('.link-input');
        const saveBtn = linkManagerSection.querySelector('.save-link-btn');
        const pasteBtn = linkManagerSection.querySelector('.paste-btn');
        const clearBtn = linkManagerSection.querySelector('.clear-link-btn');

        // Save button - IMMEDIATELY modifies form
        saveBtn.addEventListener('click', () => saveAndApplyLink(linkInput));

        // Clear button - Restores original
        clearBtn.addEventListener('click', () => clearAndRestoreOriginal());

        // Paste button
        pasteBtn.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                linkInput.value = text;
                if (isValidMWUrl(text)) {
                    saveAndApplyLink(linkInput);
                }
            } catch (err) {
                showNotification('Unable to paste from clipboard', 'error');
            }
        });

        // Enter key to save
        linkInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') saveAndApplyLink(linkInput);
        });

        // REMOVED AUTO-FOCUS - No more focus on input box
        // setTimeout(() => {
        //     linkInput.focus();
        // }, 500);

        // Check for already modified state
        checkExistingModification();

        // Check and apply pending link
        if (isInfoPage) {
            checkAndApplyPendingLink();
        }
    }

    function saveAndApplyLink(linkInput) {
        const newUrl = linkInput.value.trim();

        if (!newUrl) {
            showNotification('Please enter a URL!', 'error');
            return;
        }

        if (!isValidMWUrl(newUrl)) {
            showNotification('Please enter a valid MicroWorkers job URL!', 'error');
            return;
        }

        const newCampaignId = newUrl.split('/').pop();

        if (newCampaignId === originalCampaignId) {
            showNotification('⚠️ This is the current job!', 'error');
            linkInput.value = '';
            return;
        }

        // IMMEDIATELY modify the form - BEFORE any click
        const success = modifyFormCampaignId(newCampaignId);

        if (success) {
            // Save for fallback redirect
            localStorage.setItem('mwPendingLink', newUrl);
            localStorage.setItem('mwPendingCampaignId', newCampaignId);
            localStorage.setItem('mwSavedForPage', originalCampaignId);

            linkInput.value = '';
            isFormModified = true;

            updateAllStatus(newCampaignId);
            setupFallbackHandler(newUrl);

            showNotification('✅ Form modified! Click Accept to get: ' + newCampaignId, 'success');
        } else {
            showNotification('❌ Could not find form to modify!', 'error');
        }
    }

    function modifyFormCampaignId(newCampaignId) {
        // Find the Accept form
        const forms = document.querySelectorAll('form');
        let targetForm = null;

        for (const form of forms) {
            if (form.action && (form.action.includes('allocateposition') ||
                               form.action.includes('dotask'))) {
                targetForm = form;
                break;
            }
        }

        if (!targetForm) {
            console.log('Form not found');
            return false;
        }

        // Find campaign ID input
        let campaignInput = targetForm.querySelector('input[name="CampaignId"]') ||
                           targetForm.querySelector('input[name="campaignId"]') ||
                           targetForm.querySelector('input[name="campaign_id"]');

        // If not found, try hidden inputs with original value
        if (!campaignInput) {
            const hiddenInputs = targetForm.querySelectorAll('input[type="hidden"]');
            for (const input of hiddenInputs) {
                if (input.value === originalCampaignId) {
                    campaignInput = input;
                    break;
                }
            }
        }

        if (campaignInput) {
            console.log('✅ Changing campaign ID:', campaignInput.value, '→', newCampaignId);
            campaignInput.value = newCampaignId;
            campaignInput.dataset.originalValue = originalCampaignId;
            return true;
        }

        // Create new input if not found
        const newInput = document.createElement('input');
        newInput.type = 'hidden';
        newInput.name = 'CampaignId';
        newInput.value = newCampaignId;
        newInput.dataset.originalValue = originalCampaignId;
        targetForm.appendChild(newInput);
        console.log('✅ Created new campaign ID input:', newCampaignId);
        return true;
    }

    function clearAndRestoreOriginal() {
        // Restore form to original
        const forms = document.querySelectorAll('form');
        let restored = false;

        for (const form of forms) {
            if (form.action && (form.action.includes('allocateposition') ||
                               form.action.includes('dotask'))) {

                const campaignInput = form.querySelector('input[name="CampaignId"]') ||
                                     form.querySelector('input[name="campaignId"]') ||
                                     form.querySelector('input[name="campaign_id"]');

                if (campaignInput) {
                    // Restore to original value
                    campaignInput.value = campaignInput.dataset.originalValue || originalCampaignId;
                    restored = true;
                    console.log('✅ Restored campaign ID to:', campaignInput.value);
                }
            }
        }

        // Clear all stored data
        clearAllSavedData();

        isFormModified = false;

        updateAllStatus(null);

        if (restored) {
            showNotification('🔄 Cleared! Restored to original: ' + originalCampaignId, 'info');
        } else {
            showNotification('📍 No saved link to clear', 'info');
        }
    }

    function checkExistingModification() {
        const savedCampaignId = localStorage.getItem('mwPendingCampaignId');
        const savedForPage = localStorage.getItem('mwSavedForPage');

        if (savedCampaignId && savedForPage === originalCampaignId && savedCampaignId !== originalCampaignId) {
            const forms = document.querySelectorAll('form');

            for (const form of forms) {
                if (form.action && (form.action.includes('allocateposition') ||
                                   form.action.includes('dotask'))) {

                    const campaignInput = form.querySelector('input[name="CampaignId"]') ||
                                         form.querySelector('input[name="campaignId"]');

                    if (campaignInput && campaignInput.value === savedCampaignId) {
                        isFormModified = true;
                        updateAllStatus(savedCampaignId);
                    }
                }
            }
        }
    }

    function setupFallbackHandler(fallbackLink) {
        const forms = document.querySelectorAll('form');

        for (const form of forms) {
            if (form.action && (form.action.includes('allocateposition') ||
                               form.action.includes('dotask'))) {

                if (!form.dataset.fallbackSet) {
                    form.dataset.fallbackSet = 'true';

                    form.addEventListener('submit', function() {
                        sessionStorage.setItem('mwPendingRedirect', fallbackLink);
                        sessionStorage.setItem('mwSubmitTime', Date.now().toString());
                    });
                }
            }
        }
    }

    function checkAndApplyPendingLink() {
        const pendingRedirect = sessionStorage.getItem('mwPendingRedirect');
        const submitTime = sessionStorage.getItem('mwSubmitTime');

        if (pendingRedirect && submitTime) {
            const timeDiff = Date.now() - parseInt(submitTime);

            if (timeDiff < 5000) {
                setTimeout(() => {
                    const pageText = document.body.innerText.toLowerCase();

                    if (pageText.includes('no positions') ||
                        pageText.includes('not available') ||
                        pageText.includes('no slots') ||
                        pageText.includes('campaign is full') ||
                        pageText.includes('already completed') ||
                        pageText.includes('daily limit')) {

                        showNotification('🔄 No slots! Redirecting to saved job...', 'info');

                        clearAllSavedData();

                        setTimeout(() => {
                            window.location.href = pendingRedirect;
                        }, 1000);
                    }
                }, 500);
            }

            sessionStorage.removeItem('mwPendingRedirect');
            sessionStorage.removeItem('mwSubmitTime');
        }

        const savedLink = localStorage.getItem('mwPendingLink');
        const savedCampaignId = localStorage.getItem('mwPendingCampaignId');
        const savedForPage = localStorage.getItem('mwSavedForPage');

        if (savedLink && savedCampaignId && savedForPage === originalCampaignId && savedCampaignId !== originalCampaignId) {
            modifyFormCampaignId(savedCampaignId);
            isFormModified = true;
            updateAllStatus(savedCampaignId);
            setupFallbackHandler(savedLink);
        }
    }

    function updateAllStatus(newCampaignId) {
        const currentStatus = document.querySelector('#currentLinkStatus .status-text');
        const pendingStatus = document.querySelector('#pendingLinkStatus');
        const pendingStatusText = pendingStatus?.querySelector('.status-text');
        const modeIndicator = document.querySelector('#modeIndicator');

        if (newCampaignId) {
            if (currentStatus) {
                currentStatus.innerHTML = `Form ID: <strong style="color: #00ff88">${newCampaignId}</strong> ✓`;
            }
            if (pendingStatusText) {
                pendingStatusText.innerHTML = `Next: ${newCampaignId} ✓`;
            }
            if (pendingStatus) {
                pendingStatus.className = 'link-status pending-link active';
            }
            if (modeIndicator) {
                modeIndicator.innerHTML = `🚀 REDIRECT MODE - Will Accept: ${newCampaignId}`;
                modeIndicator.className = 'mode-indicator active';
            }
        } else {
            if (currentStatus) {
                currentStatus.innerHTML = `Form ID: ${originalCampaignId}`;
            }
            if (pendingStatusText) {
                pendingStatusText.innerHTML = 'Next: None';
            }
            if (pendingStatus) {
                pendingStatus.className = 'link-status pending-link';
            }
            if (modeIndicator) {
                modeIndicator.innerHTML = '✅ NORMAL MODE';
                modeIndicator.className = 'mode-indicator';
            }
        }
    }

    function isValidMWUrl(url) {
        return url.includes('ttv.microworkers.com/dotask/info/');
    }

    function showNotification(message, type) {
        const existing = document.querySelector('.mw-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'mw-notification';
        notification.textContent = message;
        notification.style.background = type === 'success' ? '#10b981' :
                                        type === 'error' ? '#ef4444' : '#3b82f6';
        notification.style.color = '#ffffff';
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // Initialize Link Manager
    createLinkManager();

    // ---- Extract Campaign ID for Submit Proof Page ----
    function extractCampaignId() {
        let url = location.href;
        let id = url.split('/dotask/submitProof/')[1];
        return id ? id.replace('/', '_') : null;
    }

    // ---- Create Action Button Based on Page Type ----
    function createActionButton() {
        const existingForm = content.querySelector('.action-form');
        if (existingForm) {
            existingForm.remove();
        }

        const form = document.createElement('form');
        form.className = 'action-form';
        form.method = 'POST';

        if (isInfoPage) {
            let campaignId = window.location.pathname.split("/").pop();
            form.action = '/dotask/allocateposition';

            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'CampaignId';
            hiddenInput.value = campaignId;

            const button = document.createElement('button');
            button.type = 'submit';
            button.className = 'action-button accept-start-button';
            button.innerHTML = 'ACCEPT AND START';

            button.onclick = function() {
                this.disabled = true;
                this.form.submit();
            };

            form.appendChild(hiddenInput);
            form.appendChild(button);
        } else if (isSubmitProofPage) {
            form.action = '/dotask/allocateposition';

            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = 'CampaignId';
            hidden.value = extractCampaignId();

            const button = document.createElement('button');
            button.type = 'submit';
            button.className = 'action-button dotask-again-button';
            button.innerHTML = '↻ DOTASK AGAIN';

            button.onclick = function() {
                this.disabled = true;
                this.form.submit();
            };

            form.appendChild(hidden);
            form.appendChild(button);
        }

        content.appendChild(form);
    }

    createActionButton();

    // ---- INSTANT CLICK Function for Submit Proof Page ----
    function instantClickOriginalButton() {
        if (!isSubmitProofPage) return false;

        const originalBtn = document.querySelector('button.btn.btn-success.btn-sm:not(.action-button)');

        if (originalBtn && !originalBtn.disabled) {
            console.log('Original DoTask button found - INSTANT CLICK!');
            originalBtn.disabled = true;
            originalBtn.form.submit();
            return true;
        }
        return false;
    }

    if (isSubmitProofPage) {
        setTimeout(instantClickOriginalButton, 100);
        setInterval(() => {
            instantClickOriginalButton();
        }, 1000);
    }

    // ---- Create Toggle Sections Container ----
    const togglesSection = document.createElement('div');
    togglesSection.className = 'toggles-section';
    togglesSection.innerHTML = `<div class="section-title">⚡ AUTO CLICK TOGGLES</div>`;
    content.appendChild(togglesSection);

    // Create grid container for ALL toggles
    const togglesGrid = document.createElement('div');
    togglesGrid.className = 'toggles-grid';
    togglesSection.appendChild(togglesGrid);

    // ---- Universal Toggle Creation Function ----
    const initToggleClicker = (toggleId, labelText, targetSeconds, enableCheck = false) => {
        let isRunning = false;
        let toggleButton;
        let timer;

        function checkPageForMessage() {
            if (!enableCheck) return false;

            const messageElement = document.querySelector('#content h3');
            if (messageElement) {
                const messageText = messageElement.textContent;
                if (messageText.includes('All positions taken already') ||
                    messageText.includes('Campaign unknown or not running')) {
                    return true;
                }
            }
            return false;
        }

        function clickButton() {
            const selectors = [
                '.action-button',
                '.accept-start-button',
                'button[type="submit"]',
                'input[type="submit"]',
                '.btn-primary',
                'button:contains("Start")',
                'input[value*="Start"]',
                'button:contains("Submit")',
                'input[value*="Submit"]'
            ];

            let button = null;

            for (const selector of selectors) {
                if (selector.includes('contains')) {
                    const text = selector.split('contains("')[1].split('")')[0];
                    const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
                    for (const btn of buttons) {
                        if (btn.textContent.includes(text) || btn.value.includes(text)) {
                            button = btn;
                            break;
                        }
                    }
                } else {
                    button = document.querySelector(selector);
                }
                if (button && !button.disabled) break;
            }

            if (button && !button.disabled) {
                button.click();
                playToggleSound();
            }
        }

        function toggleButtonClicker() {
            isRunning = !isRunning;
            toggleButton.classList.toggle('active', isRunning);
            row.classList.toggle('active', isRunning);

            if (isRunning) {
                // Start immediately without delay
                startButtonClicker();
            } else {
                clearTimeout(timer);
            }
            localStorage.setItem(toggleId, isRunning.toString());
        }

        function startButtonClicker() {
            const currentTime = new Date();
            const seconds = currentTime.getSeconds();
            const sec1 = Number(targetSeconds);
            const sec2 = sec1 + 30;
            let ms;

            if (checkPageForMessage()) {
                return;
            }

            if (seconds < sec1) {
                ms = (sec1 - seconds) * 1000;
            } else if (seconds < sec2) {
                ms = (sec2 - seconds) * 1000;
            } else {
                ms = ((60 - seconds) + sec1) * 1000;
            }

            timer = setTimeout(function() {
                if (isRunning) {
                    if (isSubmitProofPage && instantClickOriginalButton()) {
                        // Instant click successful
                    } else {
                        clickButton();
                    }
                    startButtonClicker();
                }
            }, ms);
        }

        const row = document.createElement('div');
        row.className = 'toggle-row';
        togglesGrid.appendChild(row);

        const label = document.createElement('span');
        label.className = 'toggle-label';
        label.textContent = labelText;
        row.appendChild(label);

        toggleButton = document.createElement('div');
        toggleButton.className = 'toggle-switch';
        toggleButton.innerHTML = `<div class="toggle-slider"></div>`;

        // Click handler responds immediately
        toggleButton.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleButtonClicker();
        });

        row.appendChild(toggleButton);

        const savedState = localStorage.getItem(toggleId);
        if (savedState === 'true') {
            isRunning = true;
            toggleButton.classList.add('active');
            row.classList.add('active');
            startButtonClicker();
        }

        window.addEventListener('beforeunload', function() {
            localStorage.setItem(toggleId, isRunning.toString());
        });
    };

    // ---- Create ALL 9 Toggles in 3x3 Grid ----
    initToggleClicker('toggle_1_31', '1/31', 1, false);
    initToggleClicker('toggle_2_32', '2/32', 2, true);
    initToggleClicker('toggle_3_33', '3/33', 3, true);
    initToggleClicker('toggle_4_34', '4/34', 4, false);
    initToggleClicker('toggle_5_35', '5/35', 5, false);
    initToggleClicker('toggle_6_36', '6/36', 6, false);
    initToggleClicker('toggle_7_37', '7/37', 7, false);
    initToggleClicker('toggle_8_38', '8/38', 8, false);
    initToggleClicker('toggle_9_39', '9/39', 9, false);

    // ---- Developer Information Section ----
    function createDeveloperInfo() {
        const devInfo = document.createElement('div');
        devInfo.className = 'developer-info';
        devInfo.innerHTML = `
            <h4>👨‍💻 DEVELOPER INFORMATION</h4>
            <p><strong>Designed By:</strong> Weird Utsho</p>
            <p><strong>Call:</strong> 01770089756</p>
            <p>
                <a href="https://wa.me/8801763141310" target="_blank">📱 WhatsApp</a> |
                <a href="https://www.facebook.com/utsh00/" target="_blank">📘 Facebook</a>
            </p>
        `;
        content.appendChild(devInfo);
    }

    createDeveloperInfo();

    // ---- Observer to handle page changes ----
    const observer = new MutationObserver(() => {
        if (!content.querySelector('.action-form')) {
            createActionButton();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();
