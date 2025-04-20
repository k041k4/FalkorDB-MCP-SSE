import EventSource from 'eventsource';
import axios from 'axios';
import { EventEmitter } from 'events';

export interface MCPQuery {
  query: string;
  graphName: string;
}

export interface MCPResponse {
  type: string;
  status: string;
  data: {
    headers: string[];
    data: any[][];
    metadata: string[];
  };
}

export class FalkorDBMCPClient extends EventEmitter {
  private baseUrl: string;
  private apiKey: string;
  private eventSource: EventSource | null = null;

  constructor(baseUrl: string, apiKey: string) {
    super();
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.eventSource = new EventSource(`${this.baseUrl}/context/stream`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });

        this.eventSource.onopen = () => {
          console.log('SSE Connection opened');
          this.emit('connected');
          resolve();
        };

        this.eventSource.onerror = (error) => {
          console.error('SSE Error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit('message', data);
          } catch (error) {
            console.error('Error parsing SSE message:', error);
            this.emit('error', error);
          }
        };
      } catch (error) {
        console.error('Error establishing SSE connection:', error);
        reject(error);
      }
    });
  }

  async sendQuery(query: MCPQuery): Promise<MCPResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/context`,
        query,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending query:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('SSE Connection closed');
      this.emit('disconnected');
    }
  }
}