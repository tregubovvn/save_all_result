/**
 * Student Grade Tracker - Main Application
 * Модульное приложение с поддержкой встраивания
 */

const App = (function() {
  // ===== State =====
  let records = [];
  let selectedGrade = '';
  let html5QrCode = null;
  let config = {
    fields: ['studentId', 'activity', 'grade', 'comment'],
    mode: 'standalone', // 'standalone' | 'embed'
    onSuccess: null,
    onError: null
  };

  // ===== DOM Elements =====
  const elements = {};

  // ===== Initialization =====
  function init(options = {}) {
    console.log('App.init() called');
    
    // Merge config
    config = { ...config, ...options };
    
    // Parse URL params for embed mode
    parseUrlParams();
    
    cacheElements();
    console.log('Elements cached');
    
    loadSettings();
    loadRecords();
    
    bindEvents();
    console.log('Events bound');
    
    applyConfig();
    updateUI();
    
    console.log('App initialized successfully!');
  }

  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('mode') && params.get('mode') === 'embed') {
      config.mode = 'embed';
    }
    
    if (params.has('fields')) {
      config.fields = params.get('fields').split(',').map(f => f.trim());
    }
  }

  function cacheElements() {
    elements.form = document.getElementById('grade-form');
    elements.studentId = document.getElementById('student-id');
    elements.activity = document.getElementById('activity');
    elements.comment = document.getElementById('comment');
    elements.btnSubmit = document.getElementById('btn-submit');
    elements.resultMessage = document.getElementById('result-message');
    
    elements.btnSettings = document.getElementById('btn-settings');
    elements.btnHistory = document.getElementById('btn-history');
    elements.settingsPanel = document.getElementById('settings-panel');
    elements.historyPanel = document.getElementById('history-panel');
    elements.serverUrl = document.getElementById('server-url');
    elements.csvFilename = document.getElementById('csv-filename');
    elements.btnSaveSettings = document.getElementById('btn-save-settings');
    
    elements.btnScanQR = document.getElementById('btn-scan-qr');
    elements.btnGenQR = document.getElementById('btn-gen-qr');
    elements.qrScannerModal = document.getElementById('qr-scanner-modal');
    elements.qrGeneratorModal = document.getElementById('qr-generator-modal');
    elements.btnCloseScanner = document.getElementById('btn-close-scanner');
    elements.btnCloseGenerator = document.getElementById('btn-close-generator');
    elements.qrInputId = document.getElementById('qr-input-id');
    elements.btnCreateQR = document.getElementById('btn-create-qr');
    elements.qrDisplay = document.getElementById('qr-display');
    elements.qrcodeCanvas = document.getElementById('qrcode-canvas');
    elements.qrIdText = document.getElementById('qr-id-text');
    
    elements.recordsList = document.getElementById('records-list');
    elements.recordsCount = document.getElementById('records-count');
    elements.historyCount = document.getElementById('history-count');
    elements.btnExport = document.getElementById('btn-export');
    
    elements.gradeButtons = Array.from(document.querySelectorAll('.grade-btn'));
    
    // Контейнеры для скрытия в embed режиме
    elements.header = document.querySelector('.header');
    elements.footer = document.querySelector('.footer');
    elements.infoCards = document.querySelector('.info-cards');
    elements.configCard = document.querySelector('.config-card');
  }

  // ===== Apply Configuration =====
  function applyConfig() {
    // Hide/show fields based on config using data-field attributes
    const fieldMap = {
      studentId: '[data-field="studentId"]',
      activity: '[data-field="activity"]',
      grade: '[data-field="grade"]',
      comment: '[data-field="comment"]'
    };

    // Hide all fields first
    Object.values(fieldMap).forEach(selector => {
      const el = elements.form.querySelector(selector);
      if (el) el.style.display = 'none';
    });

    // Show only configured fields
    config.fields.forEach(field => {
      if (fieldMap[field]) {
        const el = elements.form.querySelector(fieldMap[field]);
        if (el) el.style.display = '';
      }
    });

    // Embed mode: hide header, footer, info cards
    if (config.mode === 'embed') {
      if (elements.header) elements.header.style.display = 'none';
      if (elements.footer) elements.footer.style.display = 'none';
      if (elements.infoCards) elements.infoCards.style.display = 'none';
      if (elements.configCard) elements.configCard.style.display = 'none';
      
      // Remove padding from main
      const main = document.querySelector('.main');
      if (main) main.style.paddingTop = '0';
    }
  }

  // ===== Event Binding =====
  function bindEvents() {
    console.log('Binding events...');
    
    // Form submission
    if (elements.form) {
      elements.form.addEventListener('submit', handleSubmit);
      console.log('✓ Form submit handler bound');
    }
    
    // Settings
    if (elements.btnSettings) {
      elements.btnSettings.addEventListener('click', () => {
        console.log('Settings button clicked');
        togglePanel('settings');
      });
      console.log('✓ Settings button handler bound');
    }
    if (elements.btnSaveSettings) {
      elements.btnSaveSettings.addEventListener('click', saveSettings);
      console.log('✓ Save settings button handler bound');
    }
    
    // History
    if (elements.btnHistory) {
      elements.btnHistory.addEventListener('click', () => {
        console.log('History button clicked');
        togglePanel('history');
      });
      console.log('✓ History button handler bound');
    }
    if (elements.btnExport) {
      elements.btnExport.addEventListener('click', exportCSV);
      console.log('✓ Export button handler bound');
    }
    
    // QR Scanner
    if (elements.btnScanQR) {
      elements.btnScanQR.addEventListener('click', () => {
        console.log('QR Scanner button clicked');
        openQRScanner();
      });
      console.log('✓ QR Scanner button handler bound');
    }
    if (elements.btnCloseScanner) {
      elements.btnCloseScanner.addEventListener('click', closeQRScanner);
      console.log('✓ Close scanner button handler bound');
    }
    
    // QR Generator
    if (elements.btnGenQR) {
      elements.btnGenQR.addEventListener('click', () => {
        console.log('QR Generator button clicked');
        openQRGenerator();
      });
      console.log('✓ QR Generator button handler bound');
    }
    if (elements.btnCloseGenerator) {
      elements.btnCloseGenerator.addEventListener('click', closeQRGenerator);
      console.log('✓ Close generator button handler bound');
    }
    if (elements.btnCreateQR) {
      elements.btnCreateQR.addEventListener('click', () => {
        console.log('Create QR button clicked');
        generateQR();
      });
      console.log('✓ Create QR button handler bound');
    }
    
    // Grade buttons
    console.log('Grade buttons found:', elements.gradeButtons.length);
    elements.gradeButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        console.log('Grade button clicked:', btn.dataset.grade);
        selectGrade(btn);
      });
      console.log(`✓ Grade button ${index} (${btn.dataset.grade}) handler bound`);
    });

    // Close modals on backdrop click
    if (elements.qrScannerModal) {
      elements.qrScannerModal.addEventListener('click', (e) => {
        if (e.target === elements.qrScannerModal) closeQRScanner();
      });
    }
    if (elements.qrGeneratorModal) {
      elements.qrGeneratorModal.addEventListener('click', (e) => {
        if (e.target === elements.qrGeneratorModal) closeQRGenerator();
      });
    }
    
    console.log('All events bound successfully!');
  }

  // ===== Grade Selection =====
  function selectGrade(btn) {
    elements.gradeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedGrade = btn.dataset.grade;
  }

  // ===== Form Handling =====
  function handleSubmit(e) {
    e.preventDefault();
    
    const studentId = elements.studentId ? elements.studentId.value.trim() : '';
    const activity = elements.activity ? elements.activity.value.trim() : '';
    const grade = selectedGrade;
    const comment = elements.comment ? elements.comment.value.trim() : '';
    const dateTime = new Date().toISOString(); // Always current time

    // Validation
    if (config.fields.includes('studentId') && !studentId) {
      showResult('error', 'Введите ИД студента');
      return;
    }
    if (config.fields.includes('activity') && !activity) {
      showResult('error', 'Введите название активности');
      return;
    }
    if (config.fields.includes('grade') && !grade) {
      showResult('error', 'Выберите оценку (0-5)');
      return;
    }

    // Disable button
    elements.btnSubmit.disabled = true;
    elements.btnSubmit.querySelector('span').textContent = 'Отправка...';
    elements.btnSubmit.querySelector('i').className = 'fas fa-spinner fa-spin';

    const record = { studentId, activity, grade, comment, dateTime };

    // Send to server
    submitToServer(record)
      .then(result => {
        if (result.success) {
          // Save locally
          records.push(record);
          saveRecords();
          updateUI();
          showResult('success', result.message || 'Запись успешно сохранена!');
          
          // Trigger success callback
          triggerSuccess(record);
          
          resetForm();
        } else {
          showResult('error', result.message || 'Ошибка при сохранении');
          triggerError(result.message);
        }
      })
      .catch(error => {
        // If server unavailable, save locally
        records.push(record);
        saveRecords();
        updateUI();
        showResult('success', 'Запись сохранена локально (сервер недоступен)');
        
        // Still trigger success (saved locally)
        triggerSuccess(record);
        
        resetForm();
      })
      .finally(() => {
        elements.btnSubmit.disabled = false;
        elements.btnSubmit.querySelector('span').textContent = 'Отправить';
        elements.btnSubmit.querySelector('i').className = 'fas fa-paper-plane';
      });
  }

  // ===== Callbacks & Events =====
  function triggerSuccess(record) {
    // CustomEvent for parent application
    const event = new CustomEvent('studentRecordSaved', {
      detail: { record, success: true },
      bubbles: true
    });
    document.dispatchEvent(event);

    // Callback function if provided
    if (config.onSuccess && typeof config.onSuccess === 'function') {
      config.onSuccess(record);
    }

    // Post message for iframe integration
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'studentRecordSaved',
        record: record,
        success: true
      }, '*');
    }
  }

  function triggerError(message) {
    const event = new CustomEvent('studentRecordError', {
      detail: { message, success: false },
      bubbles: true
    });
    document.dispatchEvent(event);

    if (config.onError && typeof config.onError === 'function') {
      config.onError(message);
    }

    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'studentRecordError',
        message: message,
        success: false
      }, '*');
    }
  }

  // ===== Server Communication =====
  async function submitToServer(record) {
    let serverUrl = localStorage.getItem('serverUrl') || 'http://194.87.103.77/results/';
    const csvFilename = localStorage.getItem('csvFilename') || 'archive.csv';
    
    // Ensure URL ends with /
    if (!serverUrl.endsWith('/')) {
      serverUrl += '/';
    }

    const token = CryptoModule.generateToken();
    
    // Format CSV line
    const csvLine = [
      CryptoModule.escapeCSV(record.studentId),
      CryptoModule.escapeCSV(record.activity),
      CryptoModule.escapeCSV(record.grade),
      CryptoModule.escapeCSV(record.comment),
      CryptoModule.escapeCSV(record.dateTime)
    ].join(',');

    // Encrypt data
    const encryptedData = CryptoModule.encrypt(csvLine);

    // Build URL with filename parameter
    // Поддерживаем оба варианта: PHP и nginx+Lua
    let apiUrl;
    if (serverUrl.includes('.php')) {
      apiUrl = serverUrl + '?file=' + encodeURIComponent(csvFilename);
    } else {
      apiUrl = serverUrl + 'api/submit?file=' + encodeURIComponent(csvFilename);
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'X-Request-Token': token,
        'X-Request-Time': Date.now().toString(),
        'X-CSV-Filename': csvFilename
      },
      body: encryptedData
    });

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    return await response.json();
  }

  // ===== QR Scanner =====
  function openQRScanner() {
    elements.qrScannerModal.classList.remove('hidden');
    startQRScanner();
  }

  function closeQRScanner() {
    elements.qrScannerModal.classList.add('hidden');
    stopQRScanner();
  }

  function startQRScanner() {
    if (typeof Html5Qrcode === 'undefined') {
      alert('Библиотека QR-сканирования не загружена');
      return;
    }

    html5QrCode = new Html5Qrcode('qr-reader');
    
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    html5QrCode.start(
      { facingMode: 'environment' },
      config,
      (decodedText) => {
        if (elements.studentId) {
          elements.studentId.value = decodedText;
        }
        closeQRScanner();
        showResult('success', 'ИД студента считан из QR-кода');
      },
      () => {
        // QR code not found in frame - ignore
      }
    ).catch(err => {
      console.error('QR Scanner error:', err);
      showResult('error', 'Не удалось запустить камеру. Проверьте разрешения.');
    });
  }

  function stopQRScanner() {
    if (html5QrCode) {
      try {
        const state = html5QrCode.getState();
        if (state === 2) { // SCANNING
          html5QrCode.stop();
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      html5QrCode = null;
    }
  }

  // ===== QR Generator =====
  function openQRGenerator() {
    elements.qrGeneratorModal.classList.remove('hidden');
    if (elements.qrInputId && elements.studentId) {
      elements.qrInputId.value = elements.studentId.value || '';
    }
    elements.qrDisplay.classList.add('hidden');
  }

  function closeQRGenerator() {
    elements.qrGeneratorModal.classList.add('hidden');
  }

  function generateQR() {
    const id = elements.qrInputId.value.trim();
    if (!id) {
      alert('Введите ИД студента');
      return;
    }

    if (typeof QRCode === 'undefined') {
      alert('Библиотека генерации QR не загружена');
      return;
    }

    // Clear previous QR
    elements.qrcodeCanvas.innerHTML = '';
    
    // Generate new QR
    new QRCode(elements.qrcodeCanvas, {
      text: id,
      width: 200,
      height: 200,
      colorDark: '#1e1b4b',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });

    elements.qrIdText.textContent = id;
    elements.qrDisplay.classList.remove('hidden');
  }

  // ===== Settings =====
  function loadSettings() {
    const savedUrl = localStorage.getItem('serverUrl');
    const savedFilename = localStorage.getItem('csvFilename');
    
    if (savedUrl && elements.serverUrl) {
      elements.serverUrl.value = savedUrl;
    } else if (elements.serverUrl) {
      elements.serverUrl.value = 'http://194.87.103.77/results/';
    }
    
    if (savedFilename && elements.csvFilename) {
      elements.csvFilename.value = savedFilename;
    }
  }

  function saveSettings() {
    const url = elements.serverUrl.value.trim();
    const filename = elements.csvFilename.value.trim();
    
    if (url) {
      localStorage.setItem('serverUrl', url);
    } else {
      localStorage.setItem('serverUrl', 'http://194.87.103.77/results/');
    }
    
    if (filename) {
      localStorage.setItem('csvFilename', filename);
    } else {
      localStorage.removeItem('csvFilename');
    }
    
    elements.settingsPanel.classList.add('hidden');
    showResult('success', 'Настройки сохранены');
    setTimeout(() => hideResult(), 2000);
  }

  // ===== History =====
  function loadRecords() {
    const saved = localStorage.getItem('studentRecords');
    if (saved) {
      try {
        const decrypted = CryptoModule.decrypt(saved);
        records = JSON.parse(decrypted);
      } catch (e) {
        records = [];
      }
    }
  }

  function saveRecords() {
    const encrypted = CryptoModule.encrypt(JSON.stringify(records));
    localStorage.setItem('studentRecords', encrypted);
  }

  function togglePanel(panel) {
    if (panel === 'settings') {
      elements.settingsPanel.classList.toggle('hidden');
      if (!elements.settingsPanel.classList.contains('hidden')) {
        elements.historyPanel.classList.add('hidden');
      }
    } else if (panel === 'history') {
      elements.historyPanel.classList.toggle('hidden');
      if (!elements.historyPanel.classList.contains('hidden')) {
        elements.settingsPanel.classList.add('hidden');
        renderHistory();
      }
    }
  }

  function renderHistory() {
    elements.historyCount.textContent = records.length;
    
    if (records.length === 0) {
      elements.recordsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>Нет записей</p>
        </div>
      `;
      return;
    }

    const html = [...records].reverse().map(record => {
      const gradeClass = getGradeClass(record.grade);
      const dateStr = record.dateTime ? new Date(record.dateTime).toLocaleString('ru-RU') : '';
      
      return `
        <div class="record-item">
          <div class="record-header">
            <span class="record-id">${escapeHtml(record.studentId)}</span>
            <span class="record-grade ${gradeClass}">${escapeHtml(record.grade)}</span>
          </div>
          <div class="record-activity">${escapeHtml(record.activity)}</div>
          ${record.comment ? `<div class="record-comment">${escapeHtml(record.comment)}</div>` : ''}
          <div class="record-date"><i class="far fa-clock"></i> ${dateStr}</div>
        </div>
      `;
    }).join('');

    elements.recordsList.innerHTML = html;
  }

  function getGradeClass(grade) {
    const g = parseInt(grade);
    if (g === 5) return 'grade-excellent';
    if (g === 4) return 'grade-good';
    if (g === 3) return 'grade-satisfactory';
    return 'grade-poor'; // 0, 1, 2
  }

  // ===== Export =====
  function exportCSV() {
    if (records.length === 0) return;
    
    const headers = ['Student ID', 'Activity', 'Grade', 'Comment', 'Date/Time'];
    const csvContent = [
      headers.join(','),
      ...records.map(r => [
        CryptoModule.escapeCSV(r.studentId),
        CryptoModule.escapeCSV(r.activity),
        CryptoModule.escapeCSV(r.grade),
        CryptoModule.escapeCSV(r.comment),
        CryptoModule.escapeCSV(r.dateTime)
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_records_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ===== UI Helpers =====
  function updateUI() {
    // Update badge
    if (records.length > 0) {
      elements.recordsCount.textContent = records.length;
      elements.recordsCount.classList.remove('hidden');
    } else {
      elements.recordsCount.classList.add('hidden');
    }
  }

  function showResult(type, message) {
    elements.resultMessage.className = 'result-message ' + type;
    elements.resultMessage.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${escapeHtml(message)}</span>
    `;
    elements.resultMessage.classList.remove('hidden');
    
    if (type === 'success') {
      setTimeout(hideResult, 5000);
    }
  }

  function hideResult() {
    elements.resultMessage.classList.add('hidden');
  }

  function resetForm() {
    if (elements.studentId) elements.studentId.value = '';
    if (elements.activity) elements.activity.value = '';
    if (elements.comment) elements.comment.value = '';
    selectedGrade = '';
    elements.gradeButtons.forEach(b => b.classList.remove('active'));
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // ===== Public API =====
  return {
    init: init,
    
    // Programmatic methods
    setStudentId: function(id) {
      if (elements.studentId) elements.studentId.value = id;
    },
    
    getRecords: function() {
      return records;
    },
    
    clearRecords: function() {
      records = [];
      saveRecords();
      updateUI();
    },
    
    setConfig: function(newConfig) {
      config = { ...config, ...newConfig };
      applyConfig();
    }
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
