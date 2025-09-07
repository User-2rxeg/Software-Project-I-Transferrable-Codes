import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {FeedbackService} from "./Feedback-Service";
import {AuthModule} from "../../Authentication/Module/Authentication-Module";
import {FeedbackController} from "./Feedback-Controller";
import {Feedback, FeedbackSchema} from "../../Database/Feedback";



@Module({
    imports: [
        MongooseModule.forFeature([{ name: Feedback.name, schema: FeedbackSchema }]),
        AuthModule,
    ],
    providers: [FeedbackService],
    controllers: [FeedbackController],
    exports: [FeedbackService],
})
export class FeedbackModule {}
