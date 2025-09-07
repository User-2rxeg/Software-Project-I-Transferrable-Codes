// src/DTO/AuditLog.DTO.ts
import { IsString, IsOptional, IsMongoId, IsObject, IsDate } from 'class-validator';
import {Type} from "class-transformer";


export class CreateAuditLogDto {
    @IsMongoId()
    @IsOptional()
    userId?: string;

    @IsString()
    event!: string;

    @IsObject()
    @IsOptional()
    details?: Record<string, any>;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    timestamp?: Date;
}

export class UpdateAuditLogDto {
    @IsString()
    @IsOptional()
    event?: string;

    @IsObject()
    @IsOptional()
    details?: Record<string, any>;
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



