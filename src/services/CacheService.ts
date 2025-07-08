import { RedisClientType, createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

class CacheService {
  private static instance: CacheService;
  private redisClient: RedisClientType;
  private isConnected: boolean = false;

  private constructor() {
    this.redisClient = createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      password: process.env.REDIS_PASSWORD || undefined,
    });

    this.redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    this.redisClient.on('connect', () => {
      this.isConnected = true;
      console.log('Redis Client Connected');
    });
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.redisClient.connect();
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  public async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await this.redisClient.set(key, JSON.stringify(value), { EX: ttl });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.redisClient.quit();
      this.isConnected = false;
    }
  }
}

export default CacheService; 