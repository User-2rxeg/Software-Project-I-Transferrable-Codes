// src/DTO/BackUpDTO.ts
import {IsString, IsIn, IsOptional, IsEnum} from 'class-validator';
import {BackupDataType} from "../Database/Backup";


export class RunBackupDTO {
    @IsEnum(BackupDataType)
    dataType!: BackupDataType; // 'users' | 'courses' | 'performances' | 'all'
}

export class UpdateBackupDTO {
    @IsOptional()
    @IsString()
    storageLink?: string;

    @IsOptional()
    @IsEnum(BackupDataType)
    dataType?: BackupDataType;
}




//export class RunBackupDTO {
    //@IsString()
    //@IsIn(['users', 'courses', 'performances', 'all'])
  //  dataType!: 'users' | 'courses' | 'performances' | 'all';
//}

//export class UpdateBackupDTO {
    //@IsOptional() @IsString()
    //storageLink?: string;

   // @IsOptional()
   // @IsIn(['users', 'courses', 'performances', 'all'])
  //  dataType?: 'users' | 'courses' | 'performances' | 'all';
//}


// export class RunBackupDTO {
//     @IsEnum(BackupDataType)
//     dataType!: BackupDataType; // 'users' | 'courses' | 'performances' | 'all'
// }
//
//
// export class UpdateBackupDTO {
//     @IsOptional() @IsString()
//     storageLink?: string;
//
//
//     @IsOptional() @IsEnum(BackupDataType)
//     dataType?: BackupDataType;
// }