import { encrypt, generateToken } from './crypto';

export interface StudentRecord {
  studentId: string;
  activity: string;
  grade: string;
  comment: string;
  dateTime: string;
  fileUrl: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

// Конфигурация API endpoint
const API_BASE_URL = '/api';

export async function submitRecord(record: StudentRecord): Promise<ApiResponse> {
  try {
    const token = generateToken();
    
    // Шифруем данные перед отправкой
    const encryptedData = encrypt(JSON.stringify(record));
    
    const payload = {
      token,
      data: encryptedData,
      timestamp: Date.now()
    };

    const response = await fetch(`${API_BASE_URL}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Token': token,
        'X-Request-Time': Date.now().toString()
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting record:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function getRecords(): Promise<StudentRecord[]> {
  try {
    const token = generateToken();
    const response = await fetch(`${API_BASE_URL}/records`, {
      method: 'GET',
      headers: {
        'X-Request-Token': token,
        'X-Request-Time': Date.now().toString()
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching records:', error);
    return [];
  }
}
