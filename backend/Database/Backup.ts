import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';



export type BackupDocument = HydratedDocument<Backup>;

export enum BackupStorageKind {
    FS = 'fs',
}

export enum BackupDataType {
    USERS = 'users',
    COURSES = 'courses',
    PERFORMANCES = 'performances',
    ALL = 'all',
}

@Schema({ collection: 'backups', versionKey: false, timestamps: true })
export class Backup {
    @Prop({ type: Date, default: Date.now, required: true, index: true })
    backupDate!: Date;

    @Prop({ type: String, required: true, enum: Object.values(BackupDataType), index: true })
    dataType!: BackupDataType;

    // e.g. file:///abs/path/backup-users-2025-08-25T13-32-11-123Z.json.gz
    @Prop({ type: String, required: true })
    storageLink!: string;

    @Prop({ type: String, required: false, default: BackupStorageKind.FS })
    storage?: BackupStorageKind;

    @Prop({ type: Boolean, default: true })
    compressed!: boolean;

    @Prop({ type: Boolean, default: false })
    encrypted!: boolean;

    @Prop({ type: Number, required: false })
    sizeBytes?: number;

    @Prop({ type: String, required: false })
    checksumSha256?: string;

    @Prop({ type: Number, required: false })
    itemsCount?: number;

    @Prop({ type: Date, required: false })
    retentionUntil?: Date;
}

export const BackupSchema = SchemaFactory.createForClass(Backup);
BackupSchema.index({ backupDate: -1 });
BackupSchema.index({ dataType: 1, backupDate: -1 });

//export type BackupDocument = HydratedDocument<Backup>;

//@Schema()
//export class Backup {
    //@Prop({ type: Date, default: Date.now, required: true })
    //backupDate: Date = new Date();

    //@Prop({ type: String, required: true })
    //dataType!: string;

    //@Prop({ type: String, required: true })
  //  storageLink!: string;
//}

//export const BackupSchema = SchemaFactory.createForClass(Backup);

// export type BackupDocument = HydratedDocument<Backup>;
//
//
// export enum BackupStorageKind {
//     FS = 'fs',
// }
//
//
// export enum BackupDataType {
//     USERS = 'users',
//     COURSES = 'courses',
//     PERFORMANCES = 'performances',
//     ALL = 'all',
// }
//
//
// @Schema({ collection: 'backups', versionKey: false, timestamps: true })
// export class Backup {
//     @Prop({ type: Date, default: Date.now, required: true })
//     backupDate!: Date;
//
//
//     @Prop({ type: String, required: true, enum: Object.values(BackupDataType) })
//     dataType!: BackupDataType | 'users' | 'courses' | 'performances' | 'all';
//
//
// // e.g., file:///abs/path/backup-users-2025-08-25T13-32-11-123Z.json.gz
//     @Prop({ type: String, required: true })
//     storageLink!: string;
//
//
// // operational metadata
//     @Prop({ type: String, required: false, default: BackupStorageKind.FS })
//     storage?: BackupStorageKind | 'fs';
//
//
//     @Prop({ type: Boolean, default: true })
//     compressed!: boolean;
//
//
//     @Prop({ type: Boolean, default: false })
//     encrypted!: boolean;
//
//
//     @Prop({ type: Number, required: false })
//     sizeBytes?: number;
//
//
//     @Prop({ type: String, required: false })
//     checksumSha256?: string;
//
//
//     @Prop({ type: Number, required: false })
//     itemsCount?: number;
//
//
//     @Prop({ type: Date, required: false })
//     retentionUntil?: Date;
// }
//
//
// export const BackupSchema = SchemaFactory.createForClass(Backup);
//
//
// BackupSchema.index({ backupDate: -1 });
// BackupSchema.index({ dataType: 1, backupDate: -1 });