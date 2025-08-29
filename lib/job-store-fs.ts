import { Job } from '@/types';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const JOBS_DIR = join(process.cwd(), 'temp-jobs');

// Asegurar que el directorio existe
if (!existsSync(JOBS_DIR)) {
  mkdirSync(JOBS_DIR, { recursive: true });
}

export function setJob(jobId: string, job: Job): void {
  try {
    const filePath = join(JOBS_DIR, `${jobId}.json`);
    writeFileSync(filePath, JSON.stringify(job), 'utf8');
  } catch (error) {
    console.error(`Error saving job ${jobId}:`, error);
  }
}

export function getJob(jobId: string): Job | undefined {
  try {
    const filePath = join(JOBS_DIR, `${jobId}.json`);
    if (!existsSync(filePath)) {
      return undefined;
    }
    const data = readFileSync(filePath, 'utf8');
    const job = JSON.parse(data);
    // Convertir fechas de strings a Date objects
    job.createdAt = new Date(job.createdAt);
    job.updatedAt = new Date(job.updatedAt);
    return job;
  } catch (error) {
    console.error(`Error reading job ${jobId}:`, error);
    return undefined;
  }
}

export function getAllJobIds(): string[] {
  try {
    const files = require('fs').readdirSync(JOBS_DIR);
    return files
      .filter((file: string) => file.endsWith('.json'))
      .map((file: string) => file.replace('.json', ''));
  } catch (error) {
    console.error('Error reading jobs directory:', error);
    return [];
  }
}