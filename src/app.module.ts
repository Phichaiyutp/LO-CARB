import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import Keyv from 'keyv';
import { CacheableMemory, createKeyv } from 'cacheable';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { CountriesModule } from './countries/countries.module';
import { Country, CountrySchema } from './countries/countries.schema';
import { EmissionsModule } from './emissions/emissions.module';
import { Emission, EmissionSchema } from './emissions/emissions.schema';
import { SectorModule } from './sectors/sector.module';
import { Sector, SectorSchema } from './sectors/sectors.schema';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User, UserSchema } from './users/users.schema';
import KeyvRedis from '@keyv/redis';

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

    CacheModule.registerAsync({
      useFactory: async () => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            new Keyv({
              store: new KeyvRedis(process.env.REDIS_TLS_URL ?? process.env.REDIS_URL ?? 'redis://localhost:6379'),
            }),
          ],
        };
      },
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
    UsersModule,
  ],
})
export class AppModule {}
