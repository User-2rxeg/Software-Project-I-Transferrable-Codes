import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BackupDocument = HydratedDocument<Backup>;

@Schema()
export class Backup {
    @Prop({ type: Date, default: Date.now, required: true })
    backupDate: Date = new Date();

    @Prop({ type: String, required: true })
    dataType!: string;

    @Prop({ type: String, required: true })
    storageLink!: string;
}

export const BackupSchema = SchemaFactory.createForClass(Backup);