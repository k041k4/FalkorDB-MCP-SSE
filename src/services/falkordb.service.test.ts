import { falkorDBService } from './falkordb.service';

// Mock the FalkorDB library
jest.mock('falkordb', () => {
  const mockSelectGraph = jest.fn();
  const mockQuery = jest.fn();
  const mockList = jest.fn();
  const mockClose = jest.fn();
  const mockPing = jest.fn();
  
  return {
    FalkorDB: {
      connect: jest.fn().mockResolvedValue({
        connection: Promise.resolve({
          ping: mockPing
        }),
        selectGraph: mockSelectGraph.mockReturnValue({
          query: mockQuery
        }),
        list: mockList,
        close: mockClose
      })
    },
    mockSelectGraph,
    mockQuery,
    mockList,
    mockClose,
    mockPing
  };
});

describe('FalkorDB Service', () => {
  let mockFalkorDB: any;
  
  beforeAll(() => {
    // Access the mocks
    mockFalkorDB = require('falkordb');
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('executeQuery', () => {
    it('should execute a query with parameters', async () => {
      // Arrange
      const query = 'MATCH (n) RETURN n';
      const params = { param1: 'value1' };
      const expectedResult = { records: [{ id: 1 }] };
      
      // Mock the client
      (falkorDBService as any).client = {
        graph: {
          query: jest.fn().mockResolvedValue(expectedResult)
        }
      };
      
      // Act
      const result = await falkorDBService.executeQuery(query, params);
      
      // Assert
      expect((falkorDBService as any).client.graph.query).toHaveBeenCalledWith('default', query, params);
      expect(result).toEqual(expectedResult);
    });
    
    it('should throw an error if client is not initialized', async () => {
      // Arrange
      (falkorDBService as any).client = null;
      
      // Act & Assert
      await expect(falkorDBService.executeQuery('query'))
        .rejects
        .toThrow();
    });
  });
  
  describe('listGraphs', () => {
    it('should return a list of graphs', async () => {
      // Arrange
      const expectedGraphs = ['graph1', 'graph2'];
      
      // Mock the client
      (falkorDBService as any).client = {
        graph: {
          list: jest.fn().mockResolvedValue(expectedGraphs)
        }
      };
      
      // Act
      const result = await falkorDBService.listGraphs();
      
      // Assert
      expect((falkorDBService as any).client.graph.list).toHaveBeenCalled();
      expect(result).toEqual(expectedGraphs.map(name => ({
        name,
        type: 'property',
        directed: true
      })));
    });
    
    it('should throw an error if client is not initialized', async () => {
      // Arrange
      (falkorDBService as any).client = null;
      
      // Act & Assert
      await expect(falkorDBService.listGraphs())
        .rejects
        .toThrow();
    });
  });
  
  describe('close', () => {
    it('should close the client connection', async () => {
      // Arrange
      const mockQuit = jest.fn().mockResolvedValue(undefined);
      (falkorDBService as any).client = {
        quit: mockQuit
      };
      (falkorDBService as any).isConnected = true;
      
      // Act
      await falkorDBService.close();
      
      // Assert
      expect(mockQuit).toHaveBeenCalled();
      expect((falkorDBService as any).isConnected).toBe(false);
    });
    
    it('should not throw if client is not connected', async () => {
      // Arrange
      (falkorDBService as any).isConnected = false;
      
      // Act & Assert
      await expect(falkorDBService.close()).resolves.not.toThrow();
    });
  });
});