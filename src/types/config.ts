export interface Config {
  port: string;
  falkorDB: {
    host: string;
    port: number;
    username: string;
    password: string;
    retryStrategy: (times: number) => number;
    maxRetriesPerRequest: number;
    enableReadyCheck: boolean;
    enableOfflineQueue: boolean;
    defaultGraph: string;
  };
  apiKey: string;
  cors: {
    origin: string;
    methods: string[];
    allowedHeaders: string[];
  };
}

// Export a type assertion to ensure the config object matches the interface
export type ConfigType = Config; 