import { config } from './index';
import { ConfigType } from '../types/config';

describe('Config', () => {
  it('should have the correct structure', () => {
    expect(config).toBeDefined();
    expect(config).toHaveProperty('port');
    expect(config).toHaveProperty('falkorDB');
    expect(config).toHaveProperty('apiKey');
    expect(config).toHaveProperty('cors');
  });

  it('should have the correct types', () => {
    const typedConfig: ConfigType = config;
    expect(typedConfig.port).toBeDefined();
    expect(typedConfig.falkorDB.host).toBeDefined();
    expect(typedConfig.falkorDB.port).toBeDefined();
    expect(typedConfig.falkorDB.username).toBeDefined();
    expect(typedConfig.falkorDB.password).toBeDefined();
    expect(typedConfig.falkorDB.retryStrategy).toBeDefined();
    expect(typedConfig.falkorDB.maxRetriesPerRequest).toBeDefined();
    expect(typedConfig.falkorDB.enableReadyCheck).toBeDefined();
    expect(typedConfig.falkorDB.enableOfflineQueue).toBeDefined();
    expect(typedConfig.falkorDB.defaultGraph).toBeDefined();
    expect(typedConfig.apiKey).toBeDefined();
    expect(typedConfig.cors.origin).toBeDefined();
    expect(typedConfig.cors.methods).toBeDefined();
    expect(typedConfig.cors.allowedHeaders).toBeDefined();
  });
});