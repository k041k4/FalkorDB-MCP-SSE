# FalkorDB MCP Server

A Model Context Protocol (MCP) server for FalkorDB, allowing AI models to query and interact with graph databases using Redis Graph functionality.

## Overview

This project implements a server that follows the Model Context Protocol (MCP) specification to connect AI models with FalkorDB graph databases. The server uses Redis Graph commands to interact with FalkorDB and formats the responses according to the MCP standard.

## Prerequisites

* Node.js (v16 or later)
* npm or yarn
* FalkorDB instance (Redis with Graph module enabled)

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/falkordb/falkordb-mcpserver.git
   cd falkordb-mcpserver
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Copy the example environment file and configure it:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration details.

## Configuration

Configuration is managed through environment variables in the `.env` file:

* `PORT`: Server port (default: 3000)
* `NODE_ENV`: Environment (development, production)
* `FALKORDB_HOST`: FalkorDB host (default: localhost)
* `FALKORDB_PORT`: FalkorDB port (default: 6379)
* `FALKORDB_USERNAME`: Username for FalkorDB authentication (if required)
* `FALKORDB_PASSWORD`: Password for FalkorDB authentication (if required)
* `FALKORDB_DEFAULT_GRAPH`: Default graph name (default: 'default')
* `MCP_API_KEY`: API key for authenticating MCP requests
* `CORS_ORIGIN`: CORS origin configuration (default: '*')

### Redis Graph Settings

The server includes Redis Graph specific settings:
* Retry Strategy: Exponential backoff with max 2000ms delay
* Max Retries Per Request: 3 attempts
* Ready Check: Enabled
* Offline Queue: Enabled

## Usage

### Development

Start the development server with hot-reloading:

```bash
npm run dev
```

### Production

Build and start the server:

```bash
npm run build
npm start
```

## API Endpoints

* `GET /api/mcp/metadata`: Get metadata about the FalkorDB instance and available capabilities
* `POST /api/mcp/context`: Execute Cypher queries against FalkorDB using Redis Graph
* `GET /api/mcp/health`: Check server health
* `GET /api/mcp/graphs`: List available graphs
* `GET /api/mcp/resources`: Get resource information for a specific graph

## Query Examples

### List All Graphs
```cypher
CALL db.labels()
```

### Count Nodes in a Graph
```cypher
MATCH (n) RETURN count(n) as count
```

### Get Node Properties
```cypher
MATCH (n) RETURN DISTINCT keys(n) as properties
```

## Error Handling

The server includes robust error handling for Redis Graph operations:
* Connection errors
* Query execution errors
* Graph not found errors
* Authentication errors

## MCP Configuration

To use this server with MCP clients, you can add it to your MCP configuration:

```json
{
  "mcpServers": {
    "falkordb": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-p", "3000:3000",
        "--env-file", ".env",
        "falkordb-mcpserver",
        "falkordb://host.docker.internal:6379"
      ]
    }
  }
}
```

For client-side configuration:

```json
{
  "defaultServer": "falkordb",
  "servers": {
    "falkordb": {
      "url": "http://localhost:3000/api/mcp",
      "apiKey": "your_api_key_here"
    }
  }
}
```

## Contributing

Contributions are welcome! Please read our contributing guidelines for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
