
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { BackupService } from './Backup-Service';
import {RunBackupDTO, UpdateBackupDTO} from "../Validators/Backup-Validator";
import {UserRole} from "../Database/User";
import {Roles} from "../Authentication/Decorators/Role-Decorator";
import {JwtAuthGuard} from "../Authentication/Guards/AuthGuard";
import {RolesGuard} from "../Authentication/Guards/Roles-Guard";




//@Controller('backups')
//@UseGuards(JwtAuthGuard, RolesGuard)
//@Roles(UserRole.ADMIN)
//export class BackupController {
  //  constructor(private readonly backup: BackupService) {}

    //@Post('run')
    //async run(@Body() dto: RunBackupDTO) {
      //  return this.backup.runBackup(dto);
   // }

    //@Get()
    //async list(@Query('page') page?: string, @Query('limit') limit?: string) {
      //  return this.backup.list(parseInt(page || '1'), parseInt(limit || '20'));
    //}

    //@Get(':id')
    //async one(@Param('id') id: string) {
      //  return this.backup.getOne(id);
    //}

    //@Patch(':id')
    //async update(@Param('id') id: string, @Body() dto: UpdateBackupDTO) {
      //  return this.backup.update(id, dto);
    //}

    //@Delete(':id')
    //async remove(@Param('id') id: string) {
    //    return this.backup.delete(id);
  //  }
//}

@Controller('backups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class BackupController {
    constructor(private readonly backup: BackupService) {}


    @Post('run')
    async run(@Body() dto: RunBackupDTO) {
        return this.backup.runBackup(dto);
    }


    @Get()
    async list(@Query('page') page?: string, @Query('limit') limit?: string) {
        return this.backup.list(parseInt(page || '1'), parseInt(limit || '20'));
    }


    @Get(':id')
    async one(@Param('id') id: string) {
        return this.backup.getOne(id);
    }


    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateBackupDTO) {
        return this.backup.update(id, dto);
    }


    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.backup.delete(id);
    }
}