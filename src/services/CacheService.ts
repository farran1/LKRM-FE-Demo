// Mock Redis client for frontend static export
class CacheService {
  private static instance: CacheService;
  private cache: Map<string, { value: any; ttl: number }> = new Map();
  private isConnected: boolean = true;

  private constructor() {
    console.log('Mock Redis Client Connected');
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public async connect(): Promise<void> {
    // Mock connection - always connected
    this.isConnected = true;
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const item = this.cache.get(key);
      if (item && Date.now() < item.ttl) {
        return item.value;
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  public async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      const expiryTime = Date.now() + (ttl * 1000);
      this.cache.set(key, { value, ttl: expiryTime });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  public async del(key: string): Promise<void> {
    try {
      this.cache.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  public async disconnect(): Promise<void> {
    // Mock disconnect
    this.isConnected = false;
  }
}

export default CacheService; 