import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {HealthController} from "./core/controllers/health.controller";
import { PlatformModule } from './modules/platform/platform.module';
import { DataEngineModule } from './modules/data-engine/data-engine.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        PlatformModule,
        DataEngineModule,
    ],
    controllers: [HealthController],
    providers: [],
})
export class AppModule {
}
