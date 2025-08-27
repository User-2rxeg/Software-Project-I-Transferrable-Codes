import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Backup, BackupDocument } from '../Database/Backup';
import { User } from '../Database/User';

import * as path from "node:path";
import * as fs from "node:fs";
import {RunBackupDTO, UpdateBackupDTO} from "../Validators/Backup-Validator";



@Injectable()
export class BackupService {
    constructor(
        @InjectModel(Backup.name) private readonly backupModel: Model<BackupDocument>,
        @InjectModel(User.name) private readonly userModel: Model<any>,

        @InjectModel(Performance.name) private readonly perfModel: Model<any>,
    ) {}

    private BACKUP_DIR = process.env.BACKUP_DIR || path.resolve(process.cwd(), 'backups');

    private ensureDir() {
        if (!fs.existsSync(this.BACKUP_DIR)) fs.mkdirSync(this.BACKUP_DIR, { recursive: true });
    }

    private redactUser(u: any) {
        const { password, mfaSecret, mfaBackupCodes, otpCode, otpExpiresAt, ...safe } = u || {};
        return safe;
    }

    private async dumpUsers() {
        const docs = await this.userModel.find().lean().exec();
        return docs.map(this.redactUser);
    }

    //private async dumpCourses() {
        //const docs = await this.courseModel.find().lean().exec();
      //  return docs;
    //}

    private async dumpPerformances() {
        const docs = await this.perfModel.find().lean().exec();
        return docs;
    }

    async runBackup(dto: RunBackupDTO) {
        this.ensureDir();

        const ts = new Date().toISOString().replace(/[:.]/g, '-'); // safe filename
        const types = dto.dataType === 'all'
            ? ['users', 'courses', 'performances']
            : [dto.dataType];

        const results: { type: string; file: string; count: number }[] = [];

        for (const t of types) {
            let data: any[] = [];
            if (t === 'users') data = await this.dumpUsers();
            //else if (t === 'courses') data = await this.dumpCourses();
            else if (t === 'performances') data = await this.dumpPerformances();
            else continue;

            const filename = `backup-${t}-${ts}.json`;      // <-- backticks
            const filepath = path.join(this.BACKUP_DIR, filename);

            fs.writeFileSync(
                filepath,
                JSON.stringify({ type: t, exportedAt: new Date(), items: data }, null, 2),
                'utf8'
            );

            // store a record
            const storageLink = `file://${filepath}`;       // <-- backticks (you can also just store filepath)
            await this.backupModel.create({
                backupDate: new Date(),
                dataType: t,
                storageLink,
            });

            results.push({ type: t, file: storageLink, count: data.length });
        }

        return { ok: true, results };
    }


    async list(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.backupModel
                .find()
                .sort({ backupDate: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.backupModel.countDocuments().exec(),
        ]);
        return { items, total, page, limit };
    }

    async getOne(id: string) {
        const doc = await this.backupModel.findById(id).exec();
        if (!doc) throw new NotFoundException('Backup not found');
        return doc;
    }

    async update(id: string, update: UpdateBackupDTO) {
        const doc = await this.backupModel.findByIdAndUpdate(id, update, { new: true }).exec();
        if (!doc) throw new NotFoundException('Backup not found');
        return doc;
    }

    async delete(id: string) {
        const res = await this.backupModel.findByIdAndDelete(id).exec();
        if (!res) throw new NotFoundException('Backup not found');
        return { deleted: true };
    }
}