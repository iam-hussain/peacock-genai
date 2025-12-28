import fs from 'fs/promises'
import path from 'path'

/**
 * Fetches Swagger/OpenAPI JSON specification from the server and saves it locally
 */
async function fetchSwaggerSpec() {
    const baseUrl = process.env.PEACOCK_API_URL || 'http://localhost:3001'
    const outputFile = process.env.OUTPUT_FILE || 'src/data/swagger.json'

    // Common Swagger/OpenAPI JSON endpoints
    const endpoints = [
        '/docs/json'
    ]

    console.log(`Fetching Swagger spec from ${baseUrl}...`)

    for (const endpoint of endpoints) {
        try {
            const url = `${baseUrl}${endpoint}`
            console.log(`Trying: ${url}`)

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                },
            })

            if (!response.ok) {
                console.log(`  → ${response.status} ${response.statusText}`)
                continue
            }

            const contentType = response.headers.get('content-type')
            if (!contentType?.includes('application/json')) {
                console.log(`  → Unexpected content type: ${contentType}`)
                continue
            }

            const json = await response.json()

            // Validate it looks like an OpenAPI spec
            if (!json.openapi && !json.swagger) {
                console.log(`  → Response doesn't appear to be an OpenAPI spec`)
                continue
            }

            // Save to file
            const outputPath = path.join(process.cwd(), outputFile)
            await fs.writeFile(outputPath, JSON.stringify(json, null, 2), 'utf-8')

            console.log(`✓ Successfully fetched and saved to ${outputPath}`)
            console.log(`  Spec version: ${json.openapi || json.swagger || 'unknown'}`)
            console.log(`  Title: ${json.info?.title || 'N/A'}`)
            console.log(`  Version: ${json.info?.version || 'N/A'}`)
            return
        } catch (error) {
            if (error instanceof Error) {
                console.log(`  → Error: ${error.message}`)
            }
            continue
        }
    }

    console.error('✗ Failed to fetch Swagger spec from any endpoint')
    console.error(`\nTried endpoints:`)
    endpoints.forEach(ep => console.error(`  - ${baseUrl}${ep}`))
    console.error(`\nPlease check:`)
    console.error(`  1. Server is running on ${baseUrl}`)
    console.error(`  2. Swagger/OpenAPI is configured`)
    console.error(`  3. The correct endpoint path`)
    process.exit(1)
}

// Run the script
fetchSwaggerSpec().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
})

