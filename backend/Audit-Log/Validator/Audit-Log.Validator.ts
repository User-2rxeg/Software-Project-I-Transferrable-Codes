// src/Validator/AuditLog.Validator.ts
import {IsString, IsOptional, IsMongoId, IsObject, IsDate, IsEnum, Min, IsInt} from 'class-validator';
import {Type} from "class-transformer";
import {AuditEvent} from "../Model/Audit-Log";


export class CreateAuditLogDto {
    @IsMongoId()
    @IsOptional()
    userId?: string;

    @IsEnum(AuditEvent)
    event!: AuditEvent;

    @IsObject()
    @IsOptional()
    details?: Record<string, any>;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    timestamp?: Date;
}

export class UpdateAuditLogDto {
    @IsEnum(AuditEvent)
    @IsOptional()
    event?: AuditEvent;

    @IsObject()
    @IsOptional()
    details?: Record<string, any>;
}

export class ListAuditQueryDto {
    @IsOptional()
    @IsEnum(AuditEvent)
    event?: AuditEvent;

    @IsOptional()
    @IsMongoId()
    userId?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;
}


















//export class CreateAuditLogDto {
    //@IsMongoId() @IsOptional()
    //userId?: string;

    //@IsString()
    //event!: string;

    //@IsObject() @IsOptional()
    //details?: Record<string, any>;

    //@IsDate() @IsOptional()
    //timestamp?: Date; // optional; will default server-side

    //@IsOptional() @Type(() => Date) @IsDate()
  //  timestamp?: Date;
//}


//export class UpdateAuditLogDto {
    //@IsString() @IsOptional()
    //event?: string;

    //@IsObject() @IsOptional()
  //  details?: Record<string, any>;
//}


// export class CreateAuditLogDto {
//     @IsMongoId() @IsOptional()
//     userId?: string;
//
//
//     @IsString()
//     event!: string;
//
//
//     @IsObject() @IsOptional()
//     details?: Record<string, any>;
//
//
//     @IsDate() @IsOptional() @Type(() => Date)
//     timestamp?: Date; // optional; server will default
// }
//
//
// export class UpdateAuditLogDto {
//     @IsString() @IsOptional()
//     event?: string;
//
//
//     @IsObject() @IsOptional()
//     details?: Record<string, any>;
// }



