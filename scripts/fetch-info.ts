import fs from "fs/promises";
import path from "path";

/**
 * Fetches all accounts and club configuration from /api/info endpoint
 */
async function fetchInfo() {
  const baseUrl = process.env.PEACOCK_API_URL || "http://localhost:3001";
  const outputFile = process.env.INFO_OUTPUT_FILE || "src/data/base-info.json";
  const username = process.env.PEACOCK_ADMIN_USERNAME || "admin";
  const password = process.env.PEACOCK_ADMIN_PASSWORD || "peacock";

  console.log(`Fetching info from ${baseUrl}...`);

  try {
    // Step 2: Fetch info endpoint
    console.log("Fetching /api/info...");
    const infoUrl = `${baseUrl}/api/info`;
    const infoResponse = await fetch(infoUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!infoResponse.ok) {
      const errorText = await infoResponse.text();
      throw new Error(
        `API request failed: ${infoResponse.status} ${infoResponse.statusText} - ${errorText}`
      );
    }

    const contentType = infoResponse.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    const json = await infoResponse.json();

    // Validate response structure
    if (!json || typeof json !== "object") {
      throw new Error("Response is not a valid JSON object");
    }

    // Save to file
    const outputPath = path.join(process.cwd(), outputFile);
    await fs.writeFile(outputPath, JSON.stringify(json, null, 2), "utf-8");

    console.log(`✓ Successfully fetched and saved to ${outputPath}`);

    // Display summary
    const memberCount = Array.isArray(json.member) ? json.member.length : 0;
    const vendorCount = Array.isArray(json.vendor) ? json.vendor.length : 0;

    console.log(`\nSummary:`);
    console.log(`  Members: ${memberCount}`);
    console.log(`  Vendors: ${vendorCount}`);
    console.log(`  Club config: ${json.clubConfig ? "Yes" : "No"}`);
    console.log(`  Club data: ${json.clubData ? "Yes" : "No"}`);
  } catch (error) {
    console.error("✗ Failed to fetch info");
    if (error instanceof Error) {
      console.error(`  Error: ${error.message}`);
    } else {
      console.error(`  Error: ${String(error)}`);
    }
    console.error(`\nPlease check:`);
    console.error(`  1. Server is running on ${baseUrl}`);
    console.error(`  2. Admin credentials are correct (username: ${username})`);
    console.error(`  3. The /api/info endpoint is accessible`);
    process.exit(1);
  }
}

// Run the script
fetchInfo().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
