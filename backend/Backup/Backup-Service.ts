import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {Backup, BackupDataType, BackupDocument, BackupStorageKind} from '../Database/Backup';
import { User } from '../Database/User';

import * as path from "node:path";
import * as fs from "node:fs";
import {RunBackupDTO, UpdateBackupDTO} from "../Validators/Backup-Validator";
import {promisify} from "node:util";
import {PassThrough, Readable} from "node:stream";
import * as zlib from "node:zlib";
import {createHash} from "node:crypto";
import { pipeline as pipelineCb, Transform } from 'node:stream';



//@Injectable()
//export class BackupService {
    //constructor(
        //@InjectModel(Backup.name) private readonly backupModel: Model<BackupDocument>,
        //@InjectModel(User.name) private readonly userModel: Model<any>,

      //  @InjectModel(Performance.name) private readonly perfModel: Model<any>,
    //) {}

    //private BACKUP_DIR = process.env.BACKUP_DIR || path.resolve(process.cwd(), 'backups');
    //private BACKUP_DIR = process.env.BACKUP_DIR || path.resolve(process.cwd(), 'backups');

    //private ensureDir() {
      //  if (!fs.existsSync(this.BACKUP_DIR)) fs.mkdirSync(this.BACKUP_DIR, { recursive: true });
    //}

    //private ensureDir() {
      //  if (!fs.existsSync(this.BACKUP_DIR)) fs.mkdirSync(this.BACKUP_DIR, { recursive: true });
    //}

    //private redactUser(u: any) {
       // const { password, mfaSecret, mfaBackupCodes, otpCode, otpExpiresAt, ...safe } = u || {};
      //  return safe;
    //}

    //private async dumpUsers() {
        //const docs = await this.userModel.find().lean().exec();
      //  return docs.map(this.redactUser);
    //}

    //private async dumpCourses() {
        //const docs = await this.courseModel.find().lean().exec();
      //  return docs;
    //}

    //private async dumpPerformances() {
        //const docs = await this.perfModel.find().lean().exec();
      //  return docs;
    //}

    //async runBackup(dto: RunBackupDTO) {
      //  this.ensureDir();

        //const ts = new Date().toISOString().replace(/[:.]/g, '-'); // safe filename
        //const types = dto.dataType === 'all'
          //  ? ['users', 'courses', 'performances']
            //: [dto.dataType];

        //const results: { type: string; file: string; count: number }[] = [];

        //for (const t of types) {
          //  let data: any[] = [];
            //if (t === 'users') data = await this.dumpUsers();
            //else if (t === 'courses') data = await this.dumpCourses();
            //else if (t === 'performances') data = await this.dumpPerformances();
            //else continue;

            //const filename = `backup-${t}-${ts}.json`;      // <-- backticks
            //const filepath = path.join(this.BACKUP_DIR, filename);

            //fs.writeFileSync(
                //filepath,
                //JSON.stringify({ type: t, exportedAt: new Date(), items: data }, null, 2),
              //  'utf8'
            //);

            // store a record
            //const storageLink = `file://${filepath}`;       // <-- backticks (you can also just store filepath)
            //await this.backupModel.create({
               // backupDate: new Date(),
                //dataType: t,
              //  storageLink,
            //});

          //  results.push({ type: t, file: storageLink, count: data.length });
        //}

      //  return { ok: true, results };
    //}


   // async list(page = 1, limit = 20) {
        //const skip = (page - 1) * limit;
        //const [items, total] = await Promise.all([
            //this.backupModel
                //.find()
               // .sort({ backupDate: -1 })
                //.skip(skip)
                //.limit(limit)
              //  .exec(),
            //this.backupModel.countDocuments().exec(),
        //]);
      //  return { items, total, page, limit };
    //}

    //async getOne(id: string) {
        //const doc = await this.backupModel.findById(id).exec();
        //if (!doc) throw new NotFoundException('Backup not found');
      //  return doc;
    //}

    //async update(id: string, update: UpdateBackupDTO) {
        //const doc = await this.backupModel.findByIdAndUpdate(id, update, { new: true }).exec();
        //if (!doc) throw new NotFoundException('Backup not found');
      //  return doc;
    //}

    //async delete(id: string) {
        //const res = await this.backupModel.findByIdAndDelete(id).exec();
      //  if (!res) throw new NotFoundException('Backup not found');
    //    return { deleted: true };
  //  }
//}



const pipeline = promisify(pipelineCb);


@Injectable()
export class BackupService {
    constructor(
        @InjectModel(Backup.name) private readonly backupModel: Model<BackupDocument>,
        @InjectModel(User.name) private readonly userModel: Model<any>,
        // @InjectModel(Course.name) private readonly courseModel: Model<any>,
        @InjectModel(Performance.name) private readonly perfModel: Model<any>,
    ) {
    }


    private BACKUP_DIR = process.env.BACKUP_DIR || path.resolve(process.cwd(), 'backups');


    private ensureDir() {
        if (!fs.existsSync(this.BACKUP_DIR)) fs.mkdirSync(this.BACKUP_DIR, {recursive: true});
    }


// —— Allow-list projections (avoid PII leaks) ——
    private USER_PROJECTION = {_id: 1, name: 1, email: 1, role: 1, createdAt: 1, updatedAt: 1};
    private COURSE_PROJECTION = {
        _id: 1,
        title: 1,
        description: 1,
        status: 1,
        instructorId: 1,
        studentsEnrolled: 1,
        createdAt: 1,
        updatedAt: 1
    };
    private PERF_PROJECTION = {_id: 1, userId: 1, courseId: 1, score: 1, createdAt: 1, updatedAt: 1};


    private cursorFor(type: BackupDataType | string) {
        if (type === BackupDataType.USERS || type === 'users') return this.userModel.find({}, this.USER_PROJECTION).lean().cursor();
        // if (type === BackupDataType.COURSES || type === 'courses') return this.courseModel.find({}, this.COURSE_PROJECTION).lean().cursor();
        if (type === BackupDataType.PERFORMANCES || type === 'performances') return this.perfModel.find({}, this.PERF_PROJECTION).lean().cursor();
        throw new Error(`Unsupported dataType: ${type}`);
    }


    private jsonArrayStream(cursor: AsyncIterable<any>, header: Record<string, any>): {
        stream: Readable;
        counter: { count: number }
    } {
        const counter = {count: 0};
        const src = Readable.from((async function* () {
            const head = {...header};
            yield Buffer.from('{');
            const keys = Object.keys(head);
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                const v = JSON.stringify(head[k]);
                yield Buffer.from(`${i === 0 ? '' : ','}\"${k}\":${v}`);
            }
            yield Buffer.from(',\"items\":[');
            let first = true;
            for await (const doc of cursor) {
                const s = JSON.stringify(doc);
                yield Buffer.from(first ? s : ',' + s);
                first = false;
                counter.count++;
            }
            yield Buffer.from(']}');
        })());
        return {stream: src, counter};
    }


    private async writeGzWithChecksum(src: Readable, outPath: string) {
        const gzip = zlib.createGzip();
        const hasher = createHash('sha256');
        const hashTap = new PassThrough();
        hashTap.on('data', chunk => hasher.update(chunk));


// ensure directory
        this.ensureDir();


        await pipeline(src, gzip, hashTap, fs.createWriteStream(outPath));


        const checksumSha256 = hasher.digest('hex');
    }

    async runBackup(dto: RunBackupDTO) {
        this.ensureDir();


        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const types = dto.dataType === BackupDataType.ALL ? [BackupDataType.USERS, BackupDataType.COURSES, BackupDataType.PERFORMANCES] : [dto.dataType];


        const results: { type: string; file: string; count: number; sizeBytes: number; checksumSha256: string }[] = [];


        for (const t of types) {
            const cursor = this.cursorFor(t);
            const filename = `backup-${t}-${ts}.json.gz`;
            const filepath = path.join(this.BACKUP_DIR, filename);


            const { stream, counter } = this.jsonArrayStream(cursor, { type: t, exportedAt: new Date().toISOString() });
            const { checksumSha256, sizeBytes } = await this.writeGzWithChecksum(stream, filepath);


            const storageLink = `file://${filepath}`;
            await this.backupModel.create({
                backupDate: new Date(),
                dataType: t as any,
                storageLink,
                storage: BackupStorageKind.FS,
                compressed: true,
                encrypted: false,
                sizeBytes,
                checksumSha256,
                itemsCount: counter.count,
            });


            results.push({ type: String(t), file: storageLink, count: counter.count, sizeBytes, checksumSha256 });
        }


        return { ok: true, results };
    }


    async list(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.backupModel.find().sort({ backupDate: -1 }).skip(skip).limit(limit).lean().exec(),
            this.backupModel.countDocuments().exec(),
        ]);
        return { items, total, page, limit };
    }


    async getOne(id: string) {
        const doc = await this.backupModel.findById(id).lean().exec();
        if (!doc) throw new NotFoundException('Backup not found');
        return doc;
    }


    async update(id: string, update: UpdateBackupDTO) {
        const doc = await this.backupModel.findByIdAndUpdate(id, update, { new: true }).lean().exec();
        if (!doc) throw new NotFoundException('Backup not found');
        return doc;
    }


    async delete(id: string) {
        const res = await this.backupModel.findByIdAndDelete(id).exec();
        if (!res) throw new NotFoundException('Backup not found');
        return { deleted: true };
    }
}