/**
 * Supabase Edge Function: Scrape Ice Conditions from Stockholm Municipality
 *
 * Source: https://sites.google.com/view/isarna
 *
 * This function:
 * 1. Fetches the Google Sites page
 * 2. Parses ice condition text for each lake
 * 3. Maps conditions to our lake database
 * 4. Updates ice_reports table
 *
 * Triggered by pg_cron every 3 minutes
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Lake name mappings from the Google Sites page to our database
// NOTE: ASCII-only for Edge Function compatibility
// Keys are search terms, values are DB name matches
const LAKE_NAME_MAP: Record<string, string[]> = {
  Drevviken: ["Drevviken"],
  Langsjon: ["Langsjon", "Langsj"],
  Magelungen: ["Magelungen"],
  Trekanten: ["Trekanten"],
  Judarn: ["Judarn"],
  Kyrksjon: ["Kyrksjon", "Kyrksj"],
  Brunnsviken: ["Brunnsviken"],
  Flaten: ["Flaten"],
  Altasjon: ["Altasjon", "ltasj"],
  Norrviken: ["Norrviken"],
  Orlangen: ["Orlangen", "Orl"],
  Rastasjon: ["Rastasjon", "stasj"],
  Bornsjon: ["Bornsjon", "Bornsj"],
  "Tyreso-Flaten": ["Tyreso-Flaten", "Tyres"],
};

interface Lake {
  id: string;
  name: string;
  slug: string;
}

interface ParsedReport {
  lakeName: string;
  status: "safe" | "uncertain" | "warning" | "no_ice";
  surfaceCondition: string | null;
  iceThickness: number | null;
  rawText: string;
  lastUpdated: string | null;
}

/**
 * Determine ice status from Swedish text
 */
function determineStatus(
  text: string
): "safe" | "uncertain" | "warning" | "no_ice" {
  const lowerText = text.toLowerCase();

  // NO ICE - ice not thick enough or closed
  if (
    lowerText.includes("inte tillr") || // tillrackligt tjock
    lowerText.includes("ej") ||
    lowerText.includes("ingen is") ||
    lowerText.includes("ppet vatten") || // oppet vatten
    lowerText.includes("smalt") ||
    lowerText.includes("stangd") // stangd for sasongen
  ) {
    return "no_ice";
  }

  // SAFE - plowed and ready
  if (
    lowerText.includes("plogad") ||
    lowerText.includes("rdigplogad") || // fardigplogad
    lowerText.includes("preparerad") ||
    lowerText.includes("ppen f") || // oppen for akning
    lowerText.includes("godkand") ||
    lowerText.includes("bra is")
  ) {
    return "safe";
  }

  // WARNING - dangerous conditions
  if (
    lowerText.includes("varning") ||
    lowerText.includes("farlig") ||
    lowerText.includes("risk") ||
    lowerText.includes("undvik") ||
    lowerText.includes("tunn is") ||
    lowerText.includes("osaker") // osaker
  ) {
    return "warning";
  }

  // UNCERTAIN - default for unclear status
  return "uncertain";
}

/**
 * Determine surface condition from Swedish text
 */
function determineSurface(text: string): string | null {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("plogad") || lowerText.includes("preparerad")) {
    return "plogad";
  }
  if (lowerText.includes("sno") || lowerText.includes("snotack")) {
    return "snow_covered";
  }
  if (lowerText.includes("ojamn") || lowerText.includes("grov")) {
    return "rough";
  }
  if (
    lowerText.includes("slat") ||
    lowerText.includes("blank") ||
    lowerText.includes("fin is")
  ) {
    return "smooth";
  }

  return null;
}

/**
 * Extract ice thickness from text (e.g., "15 cm")
 */
function extractThickness(text: string): number | null {
  const match = text.match(/(\d+)\s*(?:cm|centimeter)/i);
  if (match) {
    const thickness = parseInt(match[1], 10);
    if (thickness > 0 && thickness < 100) {
      return thickness;
    }
  }
  return null;
}

/**
 * Extract last updated date from text
 */
function extractLastUpdated(text: string): string | null {
  // Pattern: "Informationen uppdaterad: 5 januari 2026, klockan 15:00"
  const match = text.match(
    /uppdaterad[:\s]+(\d+\s+\w+\s+\d{4})[,\s]+klockan\s+(\d{1,2}:\d{2})/i
  );
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  return null;
}

/**
 * Extract the "Aktuella upplysningar" (current info) for a specific lake
 */
function extractStatusMessage(text: string, lakeName: string): string {
  // Look for "Aktuella upplysningar: MESSAGE" after the lake name
  const pattern = new RegExp(
    `${lakeName}[^]*?Aktuella upply?sningar[:\\s]+([^.!?]+[.!?]?)`,
    "i"
  );
  const match = text.match(pattern);

  if (match && match[1]) {
    // Clean up the message
    let message = match[1].trim();
    // Stop at "Banans langd" or next lake indicator
    const stopIndex = message.search(/Banans l|sjoisbana|SODERORT|VASTERORT/i);
    if (stopIndex > 0) {
      message = message.substring(0, stopIndex).trim();
    }
    return message;
  }

  return "";
}

/**
 * Parse the HTML page and extract lake reports
 */
function parseIceReports(html: string): ParsedReport[] {
  const reports: ParsedReport[] = [];

  // Extract text content and normalize
  const textContent = html
    .replace(/<[^>]+>/g, " ") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  // Known lakes to search for
  const lakesToFind = Object.keys(LAKE_NAME_MAP);

  // Check if ice is generally not thick enough (common case)
  const iceNotThickEnough = textContent.toLowerCase().includes("inte tillr");

  for (const lakeName of lakesToFind) {
    // Check if this lake is mentioned on the page
    const lakeRegex = new RegExp(`${lakeName}\\s*(?:s\\s*sj.isbana)?`, "i");
    if (!lakeRegex.test(textContent)) {
      continue;
    }

    // Extract the status message for this lake
    let statusMessage = extractStatusMessage(textContent, lakeName);

    // Determine status
    let status: "safe" | "uncertain" | "warning" | "no_ice" = "uncertain";

    if (statusMessage) {
      status = determineStatus(statusMessage);
    } else if (iceNotThickEnough) {
      // Fallback: if we found the lake but couldn't extract specific message,
      // and the page mentions ice not thick enough, use that
      statusMessage = "Isen ar inte tillrackligt tjock for vara maskiner.";
      status = "no_ice";
    }

    // Only add if we found something meaningful
    if (statusMessage) {
      const report: ParsedReport = {
        lakeName,
        status,
        surfaceCondition: determineSurface(statusMessage),
        iceThickness: extractThickness(statusMessage),
        rawText: statusMessage,
        lastUpdated: extractLastUpdated(textContent),
      };

      reports.push(report);
      console.log(`Found ${lakeName}: ${report.status} - "${report.rawText}"`);
    }
  }

  return reports;
}

/**
 * Fetch the isarna page
 */
async function fetchIsarnaPage(): Promise<string> {
  const url = "https://sites.google.com/view/isarna";

  console.log(`Fetching ${url}...`);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "ISAR-Ice-App/1.0 (Stockholm Ice Discovery)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch isarna: ${response.status}`);
  }

  return response.text();
}

/**
 * Find matching lake in database
 */
function findMatchingLake(reportLakeName: string, lakes: Lake[]): Lake | null {
  // Get all possible names for this lake
  const possibleNames = LAKE_NAME_MAP[reportLakeName] || [reportLakeName];

  for (const lake of lakes) {
    // Check if lake name matches any of the possible names
    for (const name of possibleNames) {
      if (
        lake.name.toLowerCase() === name.toLowerCase() ||
        lake.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(lake.name.toLowerCase())
      ) {
        return lake;
      }
    }

    // Also check slug
    const slugVersion = reportLakeName.toLowerCase().replace(/\s+/g, "-");

    if (lake.slug === slugVersion || lake.slug.includes(slugVersion)) {
      return lake;
    }
  }

  return null;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch and parse the isarna page
    const html = await fetchIsarnaPage();
    console.log(`Fetched HTML: ${html.length} bytes`);

    const parsedReports = parseIceReports(html);
    console.log(`Parsed ${parsedReports.length} ice reports`);

    // Get all lakes from database
    const { data: lakes, error: lakesError } = await supabase
      .from("lakes")
      .select("id, name, slug");

    if (lakesError) {
      throw new Error(`Failed to fetch lakes: ${lakesError.message}`);
    }

    console.log(`Found ${lakes?.length || 0} lakes in database`);

    // Match parsed reports to lakes and insert
    const results = {
      processed: 0,
      updated: 0,
      matched: [] as string[],
      notFound: [] as string[],
      errors: [] as string[],
    };

    for (const report of parsedReports) {
      results.processed++;

      // Find matching lake
      const lake = findMatchingLake(report.lakeName, lakes as Lake[]);

      if (!lake) {
        results.notFound.push(report.lakeName);
        console.log(`❌ Lake not found in DB: ${report.lakeName}`);
        continue;
      }

      // First, delete any existing official report for this lake
      await supabase
        .from("ice_reports")
        .delete()
        .eq("lake_id", lake.id)
        .eq("source", "official");

      // Then insert the new report (clean slate - no duplicates)
      const { error: insertError } = await supabase.from("ice_reports").insert({
        lake_id: lake.id,
        status: report.status,
        source: "official",
        ice_thickness_cm: report.iceThickness,
        surface_condition: report.surfaceCondition,
        raw_text: `${lake.name}: ${report.rawText}`,
        scraped_at: new Date().toISOString(),
        valid_from: new Date().toISOString(),
      });

      if (insertError) {
        results.errors.push(`${report.lakeName}: ${insertError.message}`);
        console.log(
          `Insert error for ${report.lakeName}: ${insertError.message}`
        );
      } else {
        results.updated++;
        results.matched.push(`${lake.name} (${report.status})`);
        console.log(`Updated ${lake.name}: ${report.status}`);
      }
    }

    // Log summary
    console.log(`\n📊 Scrape Summary:`);
    console.log(`   Processed: ${results.processed}`);
    console.log(`   Updated: ${results.updated}`);
    console.log(`   Not found: ${results.notFound.join(", ") || "none"}`);
    if (results.errors.length > 0) {
      console.log(`   Errors: ${results.errors.join("; ")}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scraped ${results.processed} reports, updated ${results.updated}`,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Scraper error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
