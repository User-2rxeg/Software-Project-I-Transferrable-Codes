import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { format as formatDate } from 'date-fns';
import {BackupMetadataDto, CreateBackupDto} from "../DTO/Backup-DTO";


@Injectable()
export class BackupService {
    private readonly logger = new Logger(BackupService.name);
    private readonly backupDir = process.env.BACKUP_LOCAL_DIR ?? join(process.cwd(), 'backups');
    private readonly mongodumpPath = process.env.MONGODUMP_PATH ?? 'mongodump';
    private readonly mongoUri = process.env.MONGODB_URI ?? '';

    private async ensureDir(): Promise<void> {
        await fs.mkdir(this.backupDir, { recursive: true });
    }

    async createBackup(opts: CreateBackupDto = {}): Promise<BackupMetadataDto> {
        if (!this.mongoUri) throw new Error('MONGODB_URI environment variable is not set');

        await this.ensureDir();

        const ts = formatDate(new Date(), "yyyy-MM-dd'T'HH-mm-ss'Z'");
        const prefix = opts.name ? `${opts.name.replace(/[^a-z0-9-_]/gi, '_')}-` : '';
        const filename = `${prefix}backup-${ts}.gz`;
        const outPath = join(this.backupDir, filename);

        const args: string[] = [];
        args.push(`--uri=${this.mongoUri}`);
        if (opts.db) args.push(`--db=${opts.db}`);
        if (opts.oplog) args.push('--oplog');
        if (opts.dumpDbUsersAndRoles) args.push('--dumpDbUsersAndRoles');
        args.push(`--archive=${outPath}`);
        args.push('--gzip');

        this.logger.log(`Running: ${this.mongodumpPath} ${args.join(' ')}`);

        return new Promise<BackupMetadataDto>((resolve, reject) => {
            const child = spawn(this.mongodumpPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });

            let stderr = '';
            child.stderr.on('data', (b) => (stderr += b.toString()));

            child.on('error', (err) => {
                this.logger.error('mongodump spawn error', err);
                reject(new Error('Failed to start mongodump: ' + err.message));
            });

            child.on('close', async (code) => {
                if (code === 0) {
                    try {
                        const s = await fs.stat(outPath);
                        const meta: BackupMetadataDto = {
                            filename,
                            path: outPath,
                            size: s.size,
                            createdAt: s.mtime,
                        };
                        this.logger.log(`Backup created: ${outPath}`);
                        resolve(meta);
                    } catch (err) {
                        this.logger.error('Backup succeeded but stat failed', String(err));
                        reject(new Error('Backup produced but metadata read failed: ' + String(err)));
                    }
                } else {
                    this.logger.error('mongodump failed', stderr);
                    // cleanup partial file
                    try { await fs.unlink(outPath).catch(() => {}); } catch {}
                    reject(new Error(`mongodump failed (exit ${code}): ${stderr}`));
                }
            });
        });
    }

    async listBackups(): Promise<BackupMetadataDto[]> {
        await this.ensureDir();
        const files = await fs.readdir(this.backupDir);
        const gz = files.filter((f) => f.endsWith('.gz'));
        const arr = await Promise.all(
            gz.map(async (fname) => {
                const p = join(this.backupDir, fname);
                const s = await fs.stat(p);
                return { filename: fname, path: p, size: s.size, createdAt: s.mtime } as BackupMetadataDto;
            }),
        );
        return arr.sort((a, b) => +b.createdAt - +a.createdAt);
    }

    async deleteBackup(filename: string): Promise<void> {
        const p = join(this.backupDir, filename);
        await fs.unlink(p);
    }
}
