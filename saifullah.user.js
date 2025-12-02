// ==UserScript==
// @name         MicroWorkers new update v4
// @namespace    http://tampermonkey.net/
// @version      7.3
// @description  Universal panel with link switching system and dual sound system with auto-stop
// @author       Weird Utsho
// @match        https://ttv.microworkers.com/dotask/info/*
// @match        https://taskv2.microworkers.com/dotask/info/*
// @match        https://ttv.microworkers.com/dotask/submitProof/*
// @match        https://www.microworkers.com/login.php
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ---- AUTHORIZATION FUNCTION (From Previous Script) ----
    // Replace 'authorizedUsername' and 'authorizedPassword' with your actual authorized credentials
    var authorizedUsername = "husain";
    var authorizedPassword = "9961";

    // Function to prompt for credentials and check authorization
    function promptForAuthorization() {
        var username = prompt("Enter your short name:");
        var password = prompt("Enter your 4 digit pin:");

        if (username === authorizedUsername && password === authorizedPassword) {
            alert("Authorization successful. You are authorized. Unauthorized users account will be terminated.");
            // Add your authorized actions or code here
            return true; // Authorization successful
        } else {
            alert("Authorization failed. You are not authorized. Unauthorized users account will be terminated.");
            return false; // Authorization failed
        }
    }

    // Loop until authorization is successful on the login page
    if (window.location.href.includes("login.php")) {
        while (!promptForAuthorization()) {
            // Keep prompting for authorization
        }
        return; // Exit after authorization on login page
    }

    // ---- Check if we should show panel ----
    const isTaskV2InfoPage = window.location.href.includes('taskv2.microworkers.com/dotask/info/');

    // SIMPLE SOLUTION: Always play sound on taskv2 page if task sound is enabled
    if (isTaskV2InfoPage) {
        // Check if task sound is enabled from localStorage
        const taskSoundEnabled = localStorage.getItem('mwTaskSound') !== 'false';

        if (taskSoundEnabled) {
            // Play sound immediately when page loads
            setTimeout(function() {
                const audio = new Audio('https://audio.jukehost.co.uk/rGvilh1n3p5lbl74Mg2UbFLGqfD2GkSB');
                audio.volume = 0.7; // Set volume to 70%
                audio.play().catch(e => {
                    console.log('Task accept sound play failed:', e);
                    // Retry once if failed
                    setTimeout(() => {
                        audio.play().catch(e2 => console.log('Retry also failed:', e2));
                    }, 500);
                });
                console.log('🎵 Task accepted - playing sound on taskv2 page');
            }, 1500); // 1.5 second delay to ensure page is loaded
        }

        // Don't create panel for taskv2 pages
        return;
    }

    // ---- Prevent Infinite Loop ----
    if (sessionStorage.getItem('mwJustSwitched') === 'true') {
        sessionStorage.removeItem('mwJustSwitched');
        console.log('Preventing reload loop after switch');
    }

    // ---- Detect current page type ----
    const isInfoPage = window.location.href.includes('/dotask/info/');
    const isSubmitProofPage = window.location.href.includes('/dotask/submitProof/');

    // ---- Create main panel (ONLY for non-taskv2 pages) ----
    const mainBar = document.createElement('div');
    mainBar.id = 'micro-workers-universal-panel';
    document.body.appendChild(mainBar);

    // Load saved position
    const savedPos = JSON.parse(localStorage.getItem('mwUniversalPanelPos') || '{}');
    if (savedPos.top && savedPos.left) {
        mainBar.style.top = savedPos.top;
        mainBar.style.left = savedPos.left;
    } else {
        mainBar.style.top = '10px';
        mainBar.style.right = '10px';
    }

    // Create header with title and buttons
    const header = document.createElement('div');
    header.id = 'panel-header';
    header.innerHTML = `
        <span style="flex:1; font-weight:bold; font-size:15px;">
            <span style="color:#ff3b30;">micro</span><span style="color:#4aa3ff;">Workers</span>
        </span>
        <button id="toggleSoundBtn" class="header-btn" title="Toggle Sound">🔊</button>
        <button id="taskSoundBtn" class="header-btn" title="Task Accept Sound">🎵</button>
        <button id="darkModeBtn" class="header-btn" title="Dark Mode">🌙</button>
        <button id="minimizeBtn" class="header-btn" title="Minimize">–</button>
    `;
    mainBar.appendChild(header);

    // Create content area for toggles and buttons
    const content = document.createElement('div');
    content.id = 'panel-content';
    mainBar.appendChild(content);

    // Style for panel
    const barStyle = document.createElement('style');
    barStyle.innerHTML = `
        #micro-workers-universal-panel {
            position: fixed;
            z-index: 99999;
            background: #ffffff;
            border: 1px solid #ccc;
            border-radius: 10px;
            width: 280px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            font-family: Arial, sans-serif;
        }

        #panel-header {
            cursor: move;
            padding: 8px 12px;
            background: #f5f5f5;
            color: #333;
            font-weight: bold;
            border-radius: 9px 9px 0 0;
            user-select: none;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #ddd;
            font-size: 12px;
        }

        .header-btn {
            background: #fff;
            color: #666;
            border: 1px solid #ccc;
            padding: 3px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            margin-left: 5px;
            line-height: 1;
        }

        .header-btn:hover {
            background: #f0f0f0;
        }

        .header-btn.active {
            background: #4CAF50;
            color: white;
            border-color: #3d8b40;
        }

        .header-btn.sound-active {
            background: #007bff;
            color: white;
            border-color: #0056b3;
        }

        #panel-content {
            padding: 10px;
            background: #f9f9f9;
            border-radius: 0 0 9px 9px;
            max-height: 400px;
            overflow-y: auto;
        }

        .link-manager {
            margin-bottom: 10px;
            padding: 8px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 6px;
        }

        .link-input-group {
            display: flex;
            gap: 5px;
            margin-bottom: 5px;
        }

        .link-input {
            flex: 1;
            padding: 6px 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 11px;
        }

        .save-link-btn {
            padding: 6px 10px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
        }

        .save-link-btn:hover {
            background: #218838;
        }

        .link-status {
            font-size: 10px;
            margin-top: 3px;
            text-align: center;
        }

        .current-link {
            color: #28a745;
        }

        .pending-link {
            color: #ff9900;
        }

        .toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #eee;
        }

        .toggle-row:last-child {
            border-bottom: none;
        }

        .toggle-label {
            color: #222;
            font-weight: 600;
            font-size: 12px;
            flex: 1;
        }

        .toggle-switch {
            width: 50px;
            height: 24px;
            background: #ddd;
            border-radius: 15px;
            cursor: pointer;
            position: relative;
            transition: all 0.2s ease;
            overflow: hidden;
            border: 1px solid #bbb;
            flex-shrink: 0;
        }

        .toggle-slider {
            width: 20px;
            height: 20px;
            background: #fff;
            border-radius: 50%;
            position: absolute;
            top: 2px;
            left: 2px;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        .toggle-switch.active {
            background: #4CAF50;
            border-color: #3d8b40;
        }

        .toggle-switch.active .toggle-slider {
            transform: translateX(26px);
        }

        .toggle-row.active .toggle-label {
            color: #4CAF50;
            font-weight: bold;
        }

        .action-form {
            margin: 12px 0 8px 0;
            text-align: center;
        }

        .action-button {
            color: #fff;
            padding: 8px 16px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            width: 100%;
            transition: background-color 0.2s;
        }

        .accept-start-button {
            background-color: #007bff;
        }

        .accept-start-button:hover {
            background-color: #0056b3;
        }

        .dotask-again-button {
            background-color: olive;
        }

        .dotask-again-button:hover {
            background-color: #6B8E23;
        }

        .action-button:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }

        .developer-info {
            margin-top: 15px;
            padding: 10px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 11px;
            text-align: center;
        }

        .developer-info h4 {
            margin: 0 0 8px 0;
            color: #333;
            font-size: 12px;
            font-weight: bold;
        }

        .developer-info p {
            margin: 4px 0;
            color: #555;
        }

        .developer-info a {
            color: #007bff;
            text-decoration: none;
            display: block;
            margin: 2px 0;
            word-break: break-all;
        }

        .developer-info a:hover {
            text-decoration: underline;
            color: #0056b3;
        }

        .dark-mode #micro-workers-universal-panel {
            background: #2d3748;
            border-color: #4A5568;
        }

        .dark-mode #panel-header {
            background: #4A5568;
            color: #e2e8f0;
            border-bottom-color: #2D3748;
        }

        .dark-mode #panel-content {
            background: #1a202c;
        }

        .dark-mode .link-manager {
            background: #2d3748;
            border-color: #4A5568;
        }

        .dark-mode .link-input {
            background: #4A5568;
            border-color: #718096;
            color: #e2e8f0;
        }

        .dark-mode .toggle-row {
            border-bottom-color: #2D3748;
        }

        .dark-mode .toggle-label {
            color: #e2e8f0;
        }

        .dark-mode .toggle-switch {
            background: #4A5568;
            border-color: #718096;
        }

        .dark-mode .toggle-switch.active {
            background: #48BB78;
            border-color: #2F855A;
        }

        .dark-mode .toggle-row.active .toggle-label {
            color: #48BB78;
        }

        .dark-mode .developer-info {
            background: #2d3748;
            border-color: #4A5568;
            color: #e2e8f0;
        }

        .dark-mode .developer-info h4 {
            color: #e2e8f0;
        }

        .dark-mode .developer-info p {
            color: #cbd5e0;
        }

        .dark-mode .developer-info a {
            color: #63b3ed;
        }

        .dark-mode .developer-info a:hover {
            color: #90cdf4;
        }

        #panel-content.minimized {
            display: none;
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

    // Load saved sound states
    const savedToggleSound = localStorage.getItem('mwToggleSound');
    const savedTaskSound = localStorage.getItem('mwTaskSound');

    // Default sound states (both ON by default)
    const toggleSoundState = savedToggleSound !== 'false';
    const taskSoundState = savedTaskSound !== 'false';

    // Set initial button states
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

    // Toggle Sound Button
    toggleSoundBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isToggleSoundOn = toggleSoundBtn.classList.toggle('active');
        toggleSoundBtn.textContent = isToggleSoundOn ? '🔊' : '🔇';
        localStorage.setItem('mwToggleSound', isToggleSoundOn.toString());
    });

    // Task Sound Button
    taskSoundBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isTaskSoundOn = taskSoundBtn.classList.toggle('sound-active');
        taskSoundBtn.textContent = isTaskSoundOn ? '🎵' : '🔇';
        localStorage.setItem('mwTaskSound', isTaskSoundOn.toString());
    });

    // Sound functions
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

    // ---- Dark Mode Toggle ----
    const darkModeBtn = document.getElementById('darkModeBtn');
    const savedDarkMode = localStorage.getItem('mwUniversalPanelDarkMode');

    if (savedDarkMode === 'true') {
        mainBar.classList.add('dark-mode');
        darkModeBtn.textContent = '☀️';
    }

    darkModeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        mainBar.classList.toggle('dark-mode');
        darkModeBtn.textContent = mainBar.classList.contains('dark-mode') ? '☀️' : '🌙';
        localStorage.setItem('mwUniversalPanelDarkMode', mainBar.classList.contains('dark-mode').toString());
    });

    // ---- Link Manager System ----
    function createLinkManager() {
        const linkManager = document.createElement('div');
        linkManager.className = 'link-manager';
        linkManager.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px; font-size: 12px;">🔗 Link Manager</div>
            <div class="link-input-group">
                <input type="text" class="link-input" placeholder="Paste new link...">
                <button class="save-link-btn">💾 Save</button>
            </div>
            <div class="link-status current-link" id="currentLinkStatus">Current: ${getCampaignId()}</div>
            <div class="link-status pending-link" id="pendingLinkStatus" style="display:none"></div>
        `;

        content.insertBefore(linkManager, content.firstChild);

        const linkInput = linkManager.querySelector('.link-input');
        const saveBtn = linkManager.querySelector('.save-link-btn');
        const currentStatus = linkManager.querySelector('#currentLinkStatus');
        const pendingStatus = linkManager.querySelector('#pendingLinkStatus');

        function getCampaignId() {
            const url = window.location.href;
            const parts = url.split('/');
            return parts[parts.length - 1];
        }

        function saveNewLink() {
            const newUrl = linkInput.value.trim();

            if (!newUrl.includes('ttv.microworkers.com/dotask/info/')) {
                alert('Please enter a valid MicroWorkers URL!');
                return;
            }

            if (window.location.href === newUrl) {
                alert('This is already the current link!');
                return;
            }

            localStorage.setItem('mwPendingLink', newUrl);
            const newId = newUrl.split('/').pop();
            pendingStatus.innerHTML = `⏳ Next refresh: ${newId}`;
            pendingStatus.style.display = 'block';

            linkInput.value = '';
            console.log('Link saved for next refresh:', newUrl);
        }

        saveBtn.addEventListener('click', saveNewLink);
        linkInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') saveNewLink();
        });

        setTimeout(() => {
            linkInput.focus();
        }, 500);

        const pendingLink = localStorage.getItem('mwPendingLink');
        if (pendingLink && pendingLink !== window.location.href) {
            const pendingId = pendingLink.split('/').pop();
            pendingStatus.innerHTML = `⏳ Next refresh: ${pendingId}`;
            pendingStatus.style.display = 'block';
        }
    }

    // ---- Developer Information Section ----
    function createDeveloperInfo() {
        const devInfo = document.createElement('div');
        devInfo.className = 'developer-info';
        devInfo.innerHTML = `
            <h4>👨‍💻 Developer Information</h4>
            <p><strong>Program Designed By:</strong> Weird Utsho</p>
            <p><strong>Call:</strong> 01770089756</p>
            <a href="https://wa.me/8801763141310" target="_blank">📱 WhatsApp: https://wa.me/8801763141310</a>
            <a href="https://www.facebook.com/utsh00/" target="_blank">📘 Facebook: https://www.facebook.com/utsh00/</a>
        `;
        content.appendChild(devInfo);
    }

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
            button.innerHTML = 'Accept and Start';

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
            button.innerHTML = '↻ DoTask Again';

            button.onclick = function() {
                this.disabled = true;
                this.form.submit();
            };

            form.appendChild(hidden);
            form.appendChild(button);
        }

        content.appendChild(form);
    }

    // Initialize Link Manager and Action Button
    createLinkManager();
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

    // Try INSTANT CLICK immediately for Submit Proof Page
    if (isSubmitProofPage) {
        setTimeout(instantClickOriginalButton, 100);
        setInterval(() => {
            instantClickOriginalButton();
        }, 1000);
    }

    // ---- Toggle button system with CONDITIONAL CHECK (EXACTLY LIKE YOUR ORIGINAL) ----
    const initToggleClicker = (toggleId, labelText, targetSeconds, enableCheck = false) => {
        let isRunning = false;
        let toggleButton;
        let timer;

        // Function to check if specific campaign status messages are present (EXACT COPY FROM YOUR SCRIPT)
        function checkPageForMessage() {
            if (!enableCheck) return false; // Only check for 2/32 and 3/33

            const messageElement = document.querySelector('#content h3');
            if (messageElement) {
                const messageText = messageElement.textContent;
                if (messageText.includes('All positions taken already') ||
                    messageText.includes('Campaign unknown or not running')) {
                    return true; // Stop clicking if either message is found
                }
            }
            return false;
        }

        function clickButton() {
            const button = document.querySelector('.action-button');
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
                startButtonClicker();
            } else {
                clearTimeout(timer);
            }
            localStorage.setItem(toggleId, isRunning.toString());
        }

        // Function to start the button clicking (EXACT LOGIC FROM YOUR ORIGINAL SCRIPT)
        function startButtonClicker() {
            const currentTime = new Date();
            const seconds = currentTime.getSeconds();
            const sec1 = Number(targetSeconds);
            const sec2 = sec1 + 30;
            let ms;

            // Check for specific campaign status messages in the page content
            if (checkPageForMessage()) {
                return; // Stop clicking if message is present (TOGGLE STAYS ON)
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
                    const pendingLink = localStorage.getItem('mwPendingLink');
                    if (pendingLink && pendingLink !== window.location.href) {
                        console.log('Switching to pending link during refresh');
                        sessionStorage.setItem('mwJustSwitched', 'true');
                        localStorage.removeItem('mwPendingLink');
                        window.location.href = pendingLink;
                        return;
                    }

                    if (isSubmitProofPage && instantClickOriginalButton()) {
                        // Instant click successful
                    } else {
                        clickButton();
                    }
                    // Schedule the next button click
                    startButtonClicker();
                }
            }, ms);
        }

        // Create toggle row
        const row = document.createElement('div');
        row.className = 'toggle-row';
        content.appendChild(row);

        // Create label (left side)
        const label = document.createElement('span');
        label.className = 'toggle-label';
        label.textContent = labelText;
        row.appendChild(label);

        // Create toggle switch (right side)
        toggleButton = document.createElement('div');
        toggleButton.className = 'toggle-switch';
        toggleButton.innerHTML = `<div class="toggle-slider"></div>`;
        toggleButton.addEventListener('click', toggleButtonClicker);
        row.appendChild(toggleButton);

        // Load saved state
        const savedState = localStorage.getItem(toggleId);
        if (savedState === 'true') {
            isRunning = true;
            toggleButton.classList.add('active');
            row.classList.add('active');
            startButtonClicker();
        }
    };

    // Create 3 toggles with conditional checks
    initToggleClicker('toggle_2_32', '2/32 Click', 2, true);
    initToggleClicker('toggle_3_33', '3/33 Click', 3, true);
    initToggleClicker('toggle_4_34', '4/34 Click', 4, false);

    // Create Developer Information Section
    createDeveloperInfo();

    // ---- Observer to handle page changes ----
    const observer = new MutationObserver(() => {
        if (!content.querySelector('.action-form')) {
            createActionButton();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();
