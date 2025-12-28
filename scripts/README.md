# Scripts

## fetch-swagger.ts

Fetches the Swagger/OpenAPI JSON specification from your server and saves it to a local file.

### Usage

```bash
# Default: fetches from http://localhost:3001 and saves to swagger.json
npm run fetch-swagger

# Custom URL and output file via environment variables
SWAGGER_URL=http://localhost:3001 OUTPUT_FILE=openapi.json npm run fetch-swagger
```

### Environment Variables

- `SWAGGER_URL` - Base URL of your server (default: `http://localhost:3001`)
- `OUTPUT_FILE` - Name of the output file (default: `swagger.json`)

### How it works

The script tries common Swagger/OpenAPI JSON endpoints:
- `/docs/json`
- `/docs/swagger.json`
- `/api-docs`
- `/swagger.json`
- `/openapi.json`
- `/v1/api-docs`

It will use the first endpoint that returns a valid OpenAPI/Swagger JSON specification.

## fetch-info.ts

Fetches all accounts and club configuration from the `/api/info` endpoint and saves it to a local file. Requires admin authentication.

### Usage

```bash
# Default: fetches from http://localhost:3001 and saves to api-info.json
npm run fetch-info

# Custom URL, output file, and credentials via environment variables
PEACOCK_API_URL=http://localhost:3001 INFO_OUTPUT_FILE=club-info.json npm run fetch-info
```

### Environment Variables

- `PEACOCK_API_URL` - Base URL of your server (default: `http://localhost:3001`)
- `INFO_OUTPUT_FILE` - Name of the output file (default: `api-info.json`)
- `PEACOCK_ADMIN_USERNAME` - Admin username for authentication (default: `admin`)
- `PEACOCK_ADMIN_PASSWORD` - Admin password for authentication (default: `peacock`)

### How it works

1. Logs in with admin credentials to get a session cookie
2. Fetches data from `/api/info` endpoint with authentication
3. Saves the response (accounts, club config, transaction mappings) to a JSON file
4. Displays a summary of the fetched data

### Output

The script saves a JSON file containing:
- **member** - Array of member accounts
- **vendor** - Array of vendor accounts
- **club** - Array of club accounts
- **system** - Array of system accounts
- **clubConfig** - Club configuration (stages, start date, interest settings)
- **clubData** - Club display data
- **transactionTypeMap** - Mapping of transaction types to display names
- **transactionTypeHumanMap** - Mapping of transaction types to human-readable descriptions

