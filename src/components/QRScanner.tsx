import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    if (!containerRef.current) return;

    try {
      const html5Qrcode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5Qrcode;
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5Qrcode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {
          // QR code not found in frame - ignore
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error('QR Scanner error:', err);
      setError('Не удалось запустить камеру. Проверьте разрешения.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">
            <i className="fas fa-qrcode mr-2"></i>
            Сканирование QR-кода
          </h3>
          <button
            onClick={() => { stopScanner(); onClose(); }}
            className="text-white/80 hover:text-white transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="p-4">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <i className="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={() => { setError(''); startScanner(); }}
                className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
              >
                Попробовать снова
              </button>
            </div>
          ) : (
            <>
              <div id="qr-reader" ref={containerRef} className="rounded-lg overflow-hidden"></div>
              {isScanning && (
                <p className="text-center text-gray-500 text-sm mt-3">
                  <i className="fas fa-camera animate-pulse mr-1"></i>
                  Наведите камеру на QR-код
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
