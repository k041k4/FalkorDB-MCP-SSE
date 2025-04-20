@echo off
set CLIENT_PORT=8080
set SERVER_PORT=9000
set NODE_ENV=development
for /f "tokens=*" %%a in ('type .env ^| findstr "MCP_API_KEY"') do set %%a
npx @modelcontextprotocol/inspector node src/index.ts --auth-header "Authorization" --auth-token "Bearer %MCP_API_KEY%" 