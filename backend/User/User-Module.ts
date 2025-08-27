import {forwardRef, Module} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../Database/User';
import { UserService } from './User-Service';
import { UserController } from './User-Controller';
import { AuthModule } from '../Authentication/Module/Authentication-Module';

@Module({
    imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        // Import AuthModule to use its services if needed
        forwardRef(()=> AuthModule), // Use forwardRef to avoid circular dependency issues
    ],

    controllers: [UserController], // No controllers defined in this module
    providers: [UserService],
    exports: [MongooseModule, UserService], // <-- EXPORT MongooseModule to expose UserModel
})
export class UserModule {}
