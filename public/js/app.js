/**
 * Student Grade Tracker - Main Application
 * Чистый JavaScript без фреймворков
 */

const App = (function() {
  // ===== State =====
  let records = [];
  let selectedGrade = '';
  let html5QrCode = null;

  // ===== DOM Elements =====
  const elements = {};

  // ===== Initialization =====
  function init() {
    cacheElements();
    loadSettings();
    loadRecords();
    bindEvents();
    setDefaultDateTime();
    updateUI();
  }

  function cacheElements() {
    elements.form = document.getElementById('grade-form');
    elements.studentId = document.getElementById('student-id');
    elements.activity = document.getElementById('activity');
    // grade-custom удалён — оценки только 0-5
    elements.comment = document.getElementById('comment');
    elements.datetime = document.getElementById('datetime');
    elements.fileUrl = document.getElementById('file-url');
    elements.btnSubmit = document.getElementById('btn-submit');
    elements.resultMessage = document.getElementById('result-message');
    
    elements.btnSettings = document.getElementById('btn-settings');
    elements.btnHistory = document.getElementById('btn-history');
    elements.settingsPanel = document.getElementById('settings-panel');
    elements.historyPanel = document.getElementById('history-panel');
    elements.serverUrl = document.getElementById('server-url');
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
    
    elements.gradeButtons = document.querySelectorAll('.grade-btn');
  }

  // ===== Event Binding =====
  function bindEvents() {
    // Form submission
    elements.form.addEventListener('submit', handleSubmit);
    
    // Settings
    elements.btnSettings.addEventListener('click', () => togglePanel('settings'));
    elements.btnSaveSettings.addEventListener('click', saveSettings);
    
    // History
    elements.btnHistory.addEventListener('click', () => togglePanel('history'));
    elements.btnExport.addEventListener('click', exportCSV);
    
    // QR Scanner
    elements.btnScanQR.addEventListener('click', openQRScanner);
    elements.btnCloseScanner.addEventListener('click', closeQRScanner);
    
    // QR Generator
    elements.btnGenQR.addEventListener('click', openQRGenerator);
    elements.btnCloseGenerator.addEventListener('click', closeQRGenerator);
    elements.btnCreateQR.addEventListener('click', generateQR);
    
    // Grade buttons
    elements.gradeButtons.forEach(btn => {
      btn.addEventListener('click', () => selectGrade(btn));
    });
    
    // Оценки только 0-5, выбор через кнопки

    // Close modals on backdrop click
    elements.qrScannerModal.addEventListener('click', (e) => {
      if (e.target === elements.qrScannerModal) closeQRScanner();
    });
    elements.qrGeneratorModal.addEventListener('click', (e) => {
      if (e.target === elements.qrGeneratorModal) closeQRGenerator();
    });
  }

  // ===== Grade Selection =====
  function selectGrade(btn) {
    elements.gradeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedGrade = btn.dataset.grade;
    elements.gradeCustom.value = '';
  }

  // ===== Form Handling =====
  function handleSubmit(e) {
    e.preventDefault();
    
    const studentId = elements.studentId.value.trim();
    const activity = elements.activity.value.trim();
    const grade = selectedGrade;
    const comment = elements.comment.value.trim();
    const dateTime = elements.datetime.value;
    const fileUrl = elements.fileUrl.value.trim();

    // Validation
    if (!studentId) {
      showResult('error', 'Введите ИД студента');
      return;
    }
    if (!activity) {
      showResult('error', 'Введите название активности');
      return;
    }
    if (!grade) {
      showResult('error', 'Выберите оценку (0-5)');
      return;
    }

    // Disable button
    elements.btnSubmit.disabled = true;
    elements.btnSubmit.querySelector('span').textContent = 'Отправка...';
    elements.btnSubmit.querySelector('i').className = 'fas fa-spinner fa-spin';

    const record = { studentId, activity, grade, comment, dateTime, fileUrl };

    // Send to server
    submitToServer(record)
      .then(result => {
        if (result.success) {
          // Save locally
          records.push(record);
          saveRecords();
          updateUI();
          showResult('success', result.message || 'Запись успешно сохранена!');
          resetForm();
        } else {
          showResult('error', result.message || 'Ошибка при сохранении');
        }
      })
      .catch(error => {
        // Если сервер недоступен, сохраняем локально
        records.push(record);
        saveRecords();
        updateUI();
        showResult('success', 'Запись сохранена локально (сервер недоступен)');
        resetForm();
      })
      .finally(() => {
        elements.btnSubmit.disabled = false;
        elements.btnSubmit.querySelector('span').textContent = 'Отправить';
        elements.btnSubmit.querySelector('i').className = 'fas fa-paper-plane';
      });
  }

  // ===== Server Communication =====
  async function submitToServer(record) {
    const serverUrl = localStorage.getItem('serverUrl');
    if (!serverUrl) {
      // Если сервер не настроен, просто возвращаем успех (данные сохранятся локально)
      return { success: true, message: 'Запись сохранена локально' };
    }

    const token = CryptoModule.generateToken();
    
    // Формируем CSV строку
    const csvLine = [
      CryptoModule.escapeCSV(record.studentId),
      CryptoModule.escapeCSV(record.activity),
      CryptoModule.escapeCSV(record.grade),
      CryptoModule.escapeCSV(record.comment),
      CryptoModule.escapeCSV(record.dateTime),
      CryptoModule.escapeCSV(record.fileUrl)
    ].join(',');

    // Шифруем данные
    const encryptedData = CryptoModule.encrypt(csvLine);

    const response = await fetch(serverUrl + '/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'X-Request-Token': token,
        'X-Request-Time': Date.now().toString()
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
        // QR код распознан
        elements.studentId.value = decodedText;
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
    elements.qrInputId.value = elements.studentId.value || '';
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

    // Очищаем предыдущий QR
    elements.qrcodeCanvas.innerHTML = '';
    
    // Генерируем новый QR
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
    if (savedUrl) {
      elements.serverUrl.value = savedUrl;
    }
  }

  function saveSettings() {
    const url = elements.serverUrl.value.trim();
    if (url) {
      localStorage.setItem('serverUrl', url);
    } else {
      localStorage.removeItem('serverUrl');
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
    
    const headers = ['Student ID', 'Activity', 'Grade', 'Comment', 'Date/Time', 'File URL'];
    const csvContent = [
      headers.join(','),
      ...records.map(r => [
        CryptoModule.escapeCSV(r.studentId),
        CryptoModule.escapeCSV(r.activity),
        CryptoModule.escapeCSV(r.grade),
        CryptoModule.escapeCSV(r.comment),
        CryptoModule.escapeCSV(r.dateTime),
        CryptoModule.escapeCSV(r.fileUrl)
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
    elements.studentId.value = '';
    elements.activity.value = '';
    elements.comment.value = '';
    elements.fileUrl.value = '';
    selectedGrade = '';
    elements.gradeButtons.forEach(b => b.classList.remove('active'));
    setDefaultDateTime();
  }

  function setDefaultDateTime() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    elements.datetime.value = local.toISOString().slice(0, 16);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // Public API
  return {
    init: init
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
