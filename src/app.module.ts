import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { CountriesModule } from './countries/countries.module';
import { Country, CountrySchema } from './countries/countries.schema';
import { EmissionsModule } from './emissions/emissions.module';
import { Emission, EmissionSchema } from './emissions/emissions.schema';
import { SectorModule } from './sectors/sector.module';
import { Sector, SectorSchema } from './sectors/sectors.schema';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './user/user.module';
import { User, UserSchema } from './user/schemas/user.schema';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env.development',
    }),

    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/default',
    ),

    MongooseModule.forFeature([
      { name: Country.name, schema: CountrySchema },
      { name: Sector.name, schema: SectorSchema },
      { name: Emission.name, schema: EmissionSchema },
      { name: User.name, schema: UserSchema },
    ]),

    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url:
          process.env.REDIS_TLS_URL ??
          process.env.REDIS_URL ??
          'redis://localhost:6379',
      }),
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),

    MulterModule.register({
      dest: './uploads',
    }),

    SectorModule,
    CountriesModule,
    EmissionsModule,
    AuthModule,
    UserModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Global rate limiter
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Global Guard
    },
  ],
})
export class AppModule {}
