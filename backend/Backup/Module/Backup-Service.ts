import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BackupOptions {
    name?: string;
    oplog?: boolean;
    dumpDbUsersAndRoles?: boolean;
}

export interface BackupMetadata {
    filename: string;
    timestamp: Date;
    size: number;
    path: string;
    options?: BackupOptions;
}


@Injectable()
export class BackupService {
    private readonly logger = new Logger(BackupService.name);
    private readonly backupDir: string;
    private readonly mongodbUri: string;
    private readonly maxBackups: number;

    constructor() {
        this.backupDir = resolve(
            process.cwd(),
            process.env.BACKUP_DIR ?? './backups'
        );
        this.mongodbUri = process.env.MONGODB_URI || 'mongodb+srv://eyad:eyad2186@cluster0.o9vpa6w.mongodb.net/?appName=Cluster0';
        this.maxBackups = parseInt(process.env.BACKUP_MAX_COUNT ?? '10', 10);
    }

    async createBackup(options: BackupOptions = {}): Promise<BackupMetadata> {
        try {
            // Ensure backup directory exists
            await fs.mkdir(this.backupDir, { recursive: true });

            // Generate backup filename with timestamp
            const timestamp = new Date();
            const dateStr = timestamp.toISOString().replace(/[:.]/g, '-').split('T')[0];
            const timeStr = timestamp.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
            const backupName = options.name || 'backup';
            const filename = `${backupName}_${dateStr}_${timeStr}`;
            const backupPath = join(this.backupDir, filename);

            this.logger.log(`Starting database backup: ${filename}`);

            // Build mongodump command
            let command = `mongodump --uri="${this.mongodbUri}" --out="${backupPath}"`;

            if (options.oplog) {
                command += ' --oplog';
            }

            if (options.dumpDbUsersAndRoles) {
                command += ' --dumpDbUsersAndRoles';
            }

            // Execute mongodump
            this.logger.debug(`Executing: ${command}`);
            const { stdout, stderr } = await execAsync(command, {
                maxBuffer: 10 * 1024 * 1024,
            });

            if (stderr) {
                this.logger.warn(`mongodump stderr: ${stderr}`);
            }

            this.logger.log(`mongodump stdout: ${stdout}`);

            // Convert BSON to JSON format
            this.logger.log(`Converting backup to JSON format...`);
            await this.convertBackupToJson(backupPath);
            this.logger.log(`JSON conversion completed`);

            // Clean up BSON and metadata files
            this.logger.log(`Cleaning up BSON and metadata files...`);
            await this.cleanupBsonAndMetadataFiles(backupPath);
            this.logger.log(`Cleanup completed`);

            // Get backup directory size
            const size = await this.getDirectorySize(backupPath);

            const metadata: BackupMetadata = {
                filename,
                timestamp,
                size,
                path: backupPath,
                options,
            };

            this.logger.log(
                `Backup completed successfully. Size: ${this.formatBytes(size)}`
            );

            // Clean up old backups if necessary
            await this.cleanupOldBackups();

            return metadata;
        } catch (error) {
            this.logger.error(
                `Backup failed: ${error instanceof Error ? error.message : String(error)}`
            );
            throw error;
        }
    }

    private async convertBackupToJson(backupPath: string): Promise<void> {
        try {
            // Get all directories in the backup path (these are database names)
            const files = await fs.readdir(backupPath, { withFileTypes: true });
            const dbDirs = files.filter(f => f.isDirectory()).map(f => f.name);

            if (dbDirs.length === 0) {
                this.logger.warn(`No database directories found in backup: ${backupPath}`);
                return;
            }

            this.logger.log(`Found ${dbDirs.length} database(s) to convert: ${dbDirs.join(', ')}`);

            for (const dbDir of dbDirs) {
                const dbPath = join(backupPath, dbDir);
                await this.convertDatabaseToJson(dbPath, dbDir);
            }
        } catch (error) {
            this.logger.warn(
                `JSON conversion failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private async convertDatabaseToJson(dbPath: string, dbName: string): Promise<void> {
        try {
            if (!(await this.pathExists(dbPath))) {
                this.logger.warn(`Database path not found: ${dbPath}`);
                return;
            }

            const files = await fs.readdir(dbPath);
            const bsonFiles = files.filter(f => f.endsWith('.bson'));

            if (bsonFiles.length === 0) {
                this.logger.warn(`No BSON files found in ${dbName}`);
                return;
            }

            this.logger.log(`Converting ${bsonFiles.length} collection(s) in database: ${dbName}`);

            for (const bsonFile of bsonFiles) {
                const bsonPath = join(dbPath, bsonFile);
                const jsonFile = bsonFile.replace('.bson', '.json');
                const jsonPath = join(dbPath, jsonFile);

                try {
                    const command = `bsondump "${bsonPath}"`;
                    const { stdout } = await execAsync(command, {
                        maxBuffer: 50 * 1024 * 1024,
                    });

                    const lines = stdout.split('\n').filter(line => line.trim());
                    const jsonObjects = lines.map(line => {
                        try {
                            return JSON.parse(line);
                        } catch {
                            return null;
                        }
                    }).filter(obj => obj !== null);

                    await fs.writeFile(
                        jsonPath,
                        JSON.stringify({ collection: jsonFile.replace('.json', ''), documents: jsonObjects }, null, 2),
                        'utf-8'
                    );

                    this.logger.debug(`Converted ${dbName}.${bsonFile} to ${jsonFile}`);
                } catch (err) {
                    this.logger.warn(`Failed to convert ${bsonFile}: ${err instanceof Error ? err.message : String(err)}`);
                }
            }
        } catch (error) {
            this.logger.warn(
                `Database conversion failed for ${dbName}: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private async cleanupBsonAndMetadataFiles(backupPath: string): Promise<void> {
        try {
            // Recursively delete all .bson and .metadata.json files
            const deleteRecursive = async (dir: string) => {
                const files = await fs.readdir(dir, { withFileTypes: true });

                for (const file of files) {
                    const filePath = join(dir, file.name);

                    if (file.isDirectory()) {
                        await deleteRecursive(filePath);
                    } else if (file.name.endsWith('.bson') || file.name.endsWith('.metadata.json')) {
                        await fs.unlink(filePath);
                        this.logger.debug(`Deleted: ${file.name}`);
                    }
                }
            };

            await deleteRecursive(backupPath);
            this.logger.log(`Successfully cleaned up BSON and metadata files from ${backupPath}`);
        } catch (error) {
            this.logger.warn(
                `Failed to cleanup BSON and metadata files: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private async pathExists(path: string): Promise<boolean> {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }

    }

    async listBackups(): Promise<BackupMetadata[]> {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
            const files = await fs.readdir(this.backupDir, { withFileTypes: true });

            const backups: BackupMetadata[] = [];

            for (const file of files) {
                if (file.isDirectory()) {
                    const filePath = join(this.backupDir, file.name);
                    const stats = await fs.stat(filePath);
                    const size = await this.getDirectorySize(filePath);

                    backups.push({
                        filename: file.name,
                        timestamp: stats.mtime,
                        size,
                        path: filePath,
                    });
                }
            }

            backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

            return backups;
        } catch (error) {
            this.logger.error(
                `Failed to list backups: ${error instanceof Error ? error.message : String(error)}`
            );
            throw error;
        }
    }

    async deleteBackup(filename: string): Promise<void> {
        try {
            const backupPath = join(this.backupDir, filename);

            if (!backupPath.startsWith(this.backupDir)) {
                throw new Error('Invalid backup path');
            }

            await fs.rm(backupPath, { recursive: true, force: true });
            this.logger.log(`Backup deleted: ${filename}`);
        } catch (error) {
            this.logger.error(
                `Failed to delete backup: ${error instanceof Error ? error.message : String(error)}`
            );
            throw error;
        }
    }

    async cleanupOldBackups(): Promise<void> {
        try {
            const backups = await this.listBackups();

            if (backups.length > this.maxBackups) {
                const backupsToDelete = backups.slice(this.maxBackups);

                this.logger.log(
                    `Cleaning up old backups. Keeping ${this.maxBackups}, deleting ${backupsToDelete.length}`
                );

                for (const backup of backupsToDelete) {
                    await this.deleteBackup(backup.filename);
                }
            }
        } catch (error) {
            this.logger.error(
                `Cleanup failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private async getDirectorySize(dirPath: string): Promise<number> {
        let size = 0;

        try {
            const files = await fs.readdir(dirPath, { withFileTypes: true });

            for (const file of files) {
                const filePath = join(dirPath, file.name);

                if (file.isDirectory()) {
                    size += await this.getDirectorySize(filePath);
                } else {
                    const stats = await fs.stat(filePath);
                    size += stats.size;
                }
            }
        } catch (error) {
            this.logger.warn(
                `Failed to calculate directory size: ${error instanceof Error ? error.message : String(error)}`
            );
        }

        return size;
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
}

