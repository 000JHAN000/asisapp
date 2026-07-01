import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
const FACES_DIR = path.join(UPLOADS_DIR, 'faces');
const BASE_DIR = path.join(FACES_DIR, 'base');
const ATTENDANCE_DIR = path.join(FACES_DIR, 'attendance');

// Asegurar directorios
[UPLOADS_DIR, FACES_DIR, BASE_DIR, ATTENDANCE_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export function saveBase64Image(base64Str: string, filePath: string): string {
  if (base64Str.includes(',')) {
    base64Str = base64Str.split(',')[1];
  }
  const buffer = Buffer.from(base64Str, 'base64');
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

export function readFileToBase64(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

export function saveBaseFace(userId: string, base64Str: string): string {
  const filePath = path.join(BASE_DIR, `${userId}.jpg`);
  return saveBase64Image(base64Str, filePath);
}

export function getBaseFacePath(userId: string): string | null {
  const filePath = path.join(BASE_DIR, `${userId}.jpg`);
  return fs.existsSync(filePath) ? filePath : null;
}

export function saveAttendanceFace(userId: string, base64Str: string): string {
  const filePath = path.join(ATTENDANCE_DIR, `${userId}.jpg`);
  return saveBase64Image(base64Str, filePath);
}

export function getAttendanceFacePath(userId: string): string | null {
  const filePath = path.join(ATTENDANCE_DIR, `${userId}.jpg`);
  return fs.existsSync(filePath) ? filePath : null;
}

export async function readFileToBase64Async(filePath: string): Promise<string | null> {
  try {
    await fsp.access(filePath);
    const buffer = await fsp.readFile(filePath);
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}
