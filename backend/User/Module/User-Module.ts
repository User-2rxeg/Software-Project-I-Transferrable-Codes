import {forwardRef, Module} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../Model/User';
import { UserService } from './User-Service';
import { UserController } from './User-Controller';
import { AuthModule } from '../../Authentication/Module/Authentication-Module';

@Module({
    imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),

        forwardRef(()=> AuthModule),
    ],

    controllers: [UserController],
    providers: [UserService],
    exports: [MongooseModule, UserService],
})
export class UserModule {}
