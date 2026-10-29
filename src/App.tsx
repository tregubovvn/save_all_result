import { useState, useEffect, useRef } from 'react';
import QRScanner from './components/QRScanner';
import QRGenerator from './components/QRGenerator';
import { submitRecord, StudentRecord, ApiResponse } from './utils/api';
import { encrypt, decrypt } from './utils/crypto';

export default function App() {
  const [formData, setFormData] = useState<StudentRecord>({
    studentId: '',
    activity: '',
    grade: '',
    comment: '',
    dateTime: new Date().toISOString().slice(0, 16),
    fileUrl: ''
  });

  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<ApiResponse | null>(null);
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Загрузка настроек из localStorage
    const savedUrl = localStorage.getItem('serverUrl');
    if (savedUrl) setServerUrl(savedUrl);
    
    // Загрузка истории из localStorage (демо)
    const savedRecords = localStorage.getItem('studentRecords');
    if (savedRecords) {
      try {
        const decrypted = decrypt(savedRecords);
        setRecords(JSON.parse(decrypted));
      } catch {
        setRecords([]);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSubmitResult(null);
  };

  const handleQRScan = (data: string) => {
    setFormData(prev => ({ ...prev, studentId: data }));
    setShowQRScanner(false);
    setSubmitResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    // Валидация
    if (!formData.studentId || !formData.activity || !formData.grade) {
      setSubmitResult({
        success: false,
        message: 'Заполните обязательные поля: ИД студента, Активность, Оценка'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Сохраняем локально (зашифровано)
      const updatedRecords = [...records, formData];
      const encryptedRecords = encrypt(JSON.stringify(updatedRecords));
      localStorage.setItem('studentRecords', encryptedRecords);
      setRecords(updatedRecords);

      // Отправка на сервер
      const result = await submitRecord(formData);
      setSubmitResult(result);

      if (result.success) {
        // Очистка формы после успешной отправки
        setFormData({
          studentId: '',
          activity: '',
          grade: '',
          comment: '',
          dateTime: new Date().toISOString().slice(0, 16),
          fileUrl: ''
        });
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: 'Ошибка при отправке данных'
      });
    }

    setIsSubmitting(false);
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    
    const headers = ['Student ID', 'Activity', 'Grade', 'Comment', 'Date/Time', 'File URL'];
    const csvContent = [
      headers.join(','),
      ...records.map(r => [
        r.studentId,
        `"${r.activity}"`,
        r.grade,
        `"${r.comment}"`,
        r.dateTime,
        r.fileUrl
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_records_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('serverUrl', serverUrl);
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <i className="fas fa-graduation-cap text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Student Tracker</h1>
              <p className="text-indigo-300/70 text-xs">Учёт оценок и активностей</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
            >
              <i className="fas fa-cog text-sm"></i>
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all relative"
            >
              <i className="fas fa-list text-sm"></i>
              {records.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {records.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 animate-in">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <i className="fas fa-server text-indigo-400"></i>
              Настройки сервера
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-indigo-300/70 text-xs mb-1 block">URL сервера (nginx)</label>
                <input
                  type="url"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://your-server.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm"
                />
              </div>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Сохранить настройки
              </button>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Student ID */}
            <div>
              <label className="text-indigo-300/80 text-sm font-medium mb-2 flex items-center gap-2">
                <i className="fas fa-id-card text-indigo-400"></i>
                ИД Студента <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  placeholder="Введите или отсканируйте QR"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowQRScanner(true)}
                  className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                  title="Сканировать QR-код"
                >
                  <i className="fas fa-qrcode"></i>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQRGenerator(true)}
                  className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                  title="Сгенерировать QR-код"
                >
                  <i className="fas fa-plus-circle"></i>
                </button>
              </div>
            </div>

            {/* Activity */}
            <div>
              <label className="text-indigo-300/80 text-sm font-medium mb-2 flex items-center gap-2">
                <i className="fas fa-book text-indigo-400"></i>
                Название активности <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="activity"
                value={formData.activity}
                onChange={handleInputChange}
                placeholder="Например: Лабораторная работа №1"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                required
              />
            </div>

            {/* Grade */}
            <div>
              <label className="text-indigo-300/80 text-sm font-medium mb-2 flex items-center gap-2">
                <i className="fas fa-star text-indigo-400"></i>
                Оценка <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {['5', '4', '3', '2', '1', 'Зачёт', 'Незачёт'].map(grade => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, grade }))}
                    className={`px-4 py-2.5 rounded-xl font-medium transition-all text-sm ${
                      formData.grade === grade
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
                <input
                  type="text"
                  name="grade"
                  value={!['5', '4', '3', '2', '1', 'Зачёт', 'Незачёт'].includes(formData.grade) ? formData.grade : ''}
                  onChange={handleInputChange}
                  placeholder="Другая..."
                  className="flex-1 min-w-[100px] bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm"
                />
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="text-indigo-300/80 text-sm font-medium mb-2 flex items-center gap-2">
                <i className="fas fa-comment text-indigo-400"></i>
                Комментарий
              </label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                placeholder="Дополнительные заметки..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
              />
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-indigo-300/80 text-sm font-medium mb-2 flex items-center gap-2">
                  <i className="fas fa-calendar text-indigo-400"></i>
                  Дата и время
                </label>
                <input
                  type="datetime-local"
                  name="dateTime"
                  value={formData.dateTime}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-indigo-300/80 text-sm font-medium mb-2 flex items-center gap-2">
                  <i className="fas fa-link text-indigo-400"></i>
                  URL файла
                </label>
                <input
                  type="url"
                  name="fileUrl"
                  value={formData.fileUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>

            {/* Submit Result */}
            {submitResult && (
              <div className={`rounded-xl p-4 flex items-center gap-3 ${
                submitResult.success 
                  ? 'bg-emerald-500/10 border border-emerald-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <i className={`fas ${submitResult.success ? 'fa-check-circle text-emerald-400' : 'fa-exclamation-circle text-red-400'} text-xl`}></i>
                <p className={`text-sm ${submitResult.success ? 'text-emerald-300' : 'text-red-300'}`}>
                  {submitResult.message}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner animate-spin"></i>
                  Отправка...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Отправить
                </>
              )}
            </button>
          </form>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="mt-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <i className="fas fa-history text-indigo-400"></i>
                История записей ({records.length})
              </h3>
              {records.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-download"></i>
                  Экспорт CSV
                </button>
              )}
            </div>

            {records.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-inbox text-4xl text-white/20 mb-3"></i>
                <p className="text-white/40">Нет записей</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {[...records].reverse().map((record, index) => (
                  <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-indigo-300 font-mono text-sm">{record.studentId}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            record.grade === '5' || record.grade === 'Зачёт' ? 'bg-emerald-500/20 text-emerald-300' :
                            record.grade === '4' ? 'bg-blue-500/20 text-blue-300' :
                            record.grade === '3' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {record.grade}
                          </span>
                        </div>
                        <p className="text-white/90 text-sm font-medium">{record.activity}</p>
                        {record.comment && (
                          <p className="text-white/50 text-xs mt-1">{record.comment}</p>
                        )}
                        <p className="text-white/30 text-xs mt-2">
                          <i className="far fa-clock mr-1"></i>
                          {new Date(record.dateTime).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <i className="fas fa-qrcode text-indigo-400 text-sm"></i>
              </div>
              <h4 className="text-white font-medium text-sm">QR-сканирование</h4>
            </div>
            <p className="text-white/50 text-xs">Сканируйте QR-код для быстрого ввода ИД студента</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <i className="fas fa-lock text-emerald-400 text-sm"></i>
              </div>
              <h4 className="text-white font-medium text-sm">Шифрование</h4>
            </div>
            <p className="text-white/50 text-xs">Данные шифруются перед отправкой на сервер</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <i className="fas fa-file-csv text-amber-400 text-sm"></i>
              </div>
              <h4 className="text-white font-medium text-sm">CSV формат</h4>
            </div>
            <p className="text-white/50 text-xs">Результаты сохраняются на сервере nginx в CSV</p>
          </div>
        </div>

        {/* Server Configuration Info */}
        <div className="mt-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <i className="fas fa-info-circle text-indigo-400"></i>
            Конфигурация сервера
          </h3>
          <div className="bg-black/30 rounded-xl p-4 overflow-x-auto">
            <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap">
{`# nginx.conf - настройка для приёма данных
server {
    listen 443 ssl;
    server_name your-domain.com;

    # SSL сертификаты
    ssl_certificate /etc/ssl/certs/server.crt;
    ssl_certificate_key /etc/ssl/private/server.key;

    # API endpoint для приёма данных
    location /api/submit {
        # Обработка через CGI/Lua/прокси
        proxy_pass http://localhost:3000;
        
        # CORS заголовки
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Content-Type, X-Request-Token, X-Request-Time';
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Статические файлы приложения
    location / {
        root /var/www/student-tracker;
        try_files $uri $uri/ /index.html;
    }
}`}
            </pre>
          </div>
          <p className="text-white/40 text-xs mt-3">
            <i className="fas fa-lightbulb text-amber-400 mr-1"></i>
            Для обработки POST-запросов и записи в CSV используйте серверный скрипт (Node.js, Python, или nginx + Lua)
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/5 py-6">
        <p className="text-center text-white/30 text-xs">
          Student Grade Tracker © 2024 | Безопасная система учёта оценок
        </p>
      </footer>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* QR Generator Modal */}
      {showQRGenerator && formData.studentId && (
        <QRGenerator
          studentId={formData.studentId}
          onClose={() => setShowQRGenerator(false)}
        />
      )}

      {/* QR Generator with manual input */}
      {showQRGenerator && !formData.studentId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-gray-800 font-semibold text-lg mb-4">
              <i className="fas fa-qrcode mr-2 text-indigo-600"></i>
              Введите ИД для генерации QR
            </h3>
            <ManualQRGenerator onClose={() => setShowQRGenerator(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// Компонент для генерации QR с ручным вводом
function ManualQRGenerator({ onClose }: { onClose: () => void }) {
  const [manualId, setManualId] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQR = async () => {
    if (!canvasRef.current || !manualId) return;
    const QRCode = (await import('qrcode')).default;
    await QRCode.toCanvas(canvasRef.current, manualId, {
      width: 200,
      margin: 2,
      color: { dark: '#1e1b4b', light: '#ffffff' }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={manualId}
          onChange={(e) => setManualId(e.target.value)}
          placeholder="ИД студента"
          className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        <button
          onClick={generateQR}
          disabled={!manualId}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors"
        >
          <i className="fas fa-qrcode"></i>
        </button>
      </div>
      <canvas ref={canvasRef} className="mx-auto rounded-lg shadow-md"></canvas>
      <button
        onClick={onClose}
        className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
      >
        Закрыть
      </button>
    </div>
  );
}


