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

