import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRGeneratorProps {
  studentId: string;
  onClose: () => void;
}

export default function QRGenerator({ studentId, onClose }: QRGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    generateQR();
  }, [studentId]);

  const generateQR = async () => {
    if (!canvasRef.current || !studentId) return;
    
    try {
      await QRCode.toCanvas(canvasRef.current, studentId, {
        width: 250,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff'
        }
      });
    } catch (err) {
      setError('Не удалось сгенерировать QR-код');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">
            <i className="fas fa-qrcode mr-2"></i>
            QR-код студента
          </h3>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center">
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <>
              <canvas ref={canvasRef} className="rounded-lg shadow-md"></canvas>
              <p className="mt-4 text-gray-600 font-mono text-sm bg-gray-100 px-3 py-1 rounded">
                {studentId}
              </p>
              <p className="mt-2 text-gray-400 text-xs">
                Отсканируйте для быстрого ввода ИД
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
