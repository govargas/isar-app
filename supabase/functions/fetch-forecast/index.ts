// Supabase Edge Function to fetch weather forecast data for ice prediction
// Source: Open-Meteo API (free, no API key required)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

interface WeatherData {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    temperature_2m: number[];
    windspeed_10m: number[];
  };
}

interface ForecastResult {
  lake_id: string;
  lake_name: string;
  temperature_avg: number;
  wind_speed_avg: number;
  freezing_hours: number;
  forecast_quality: 'good' | 'moderate' | 'poor';
}

// Calculate ice formation potential based on weather
function calculateIceQuality(temps: number[], winds: number[]): 'good' | 'moderate' | 'poor' {
  const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
  const avgWind = winds.reduce((a, b) => a + b, 0) / winds.length;
  const freezingHours = temps.filter(t => t < 0).length;
  
  // Good: Cold temps, low wind, many freezing hours
  if (avgTemp < -5 && avgWind < 5 && freezingHours > temps.length * 0.8) {
    return 'good';
  }
  
  // Moderate: Some freezing, moderate wind
  if (avgTemp < 0 && avgWind < 10 && freezingHours > temps.length * 0.5) {
    return 'moderate';
  }
  
  return 'poor';
}

// Fetch weather for a specific location
async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat.toString());
  url.searchParams.set('longitude', lon.toString());
  url.searchParams.set('hourly', 'temperature_2m,windspeed_10m');
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('timezone', 'Europe/Stockholm');
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }
  
  return await response.json();
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get lakes with their centroids
    const { data: lakes, error: lakesError } = await supabase
      .from('lakes')
      .select('id, name, slug, centroid');

    if (lakesError) {
      throw new Error(`Failed to fetch lakes: ${lakesError.message}`);
    }

    if (!lakes || lakes.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No lakes found', forecasts: [] }),
        { headers }
      );
    }

    const forecasts: ForecastResult[] = [];
    const reportsToInsert = [];

    // Fetch weather for each lake (batch to avoid rate limits)
    for (const lake of lakes) {
      try {
        // Extract coordinates from PostGIS point
        // centroid format: { type: 'Point', coordinates: [lon, lat] }
        const centroid = lake.centroid as { coordinates: [number, number] } | null;
        
        if (!centroid?.coordinates) {
          console.log(`Skipping ${lake.name}: no centroid`);
          continue;
        }
        
        const [lon, lat] = centroid.coordinates;
        
        const weather = await fetchWeather(lat, lon);
        
        const temps = weather.hourly.temperature_2m;
        const winds = weather.hourly.windspeed_10m;
        
        const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
        const avgWind = winds.reduce((a, b) => a + b, 0) / winds.length;
        const freezingHours = temps.filter(t => t < 0).length;
        const quality = calculateIceQuality(temps, winds);
        
        forecasts.push({
          lake_id: lake.id,
          lake_name: lake.name,
          temperature_avg: Math.round(avgTemp * 10) / 10,
          wind_speed_avg: Math.round(avgWind * 10) / 10,
          freezing_hours: freezingHours,
          forecast_quality: quality,
        });
        
        // Determine status based on forecast
        let status: 'safe' | 'uncertain' | 'warning' | 'no_ice' = 'uncertain';
        if (quality === 'good' && freezingHours > 100) {
          status = 'safe';
        } else if (quality === 'poor' || avgTemp > 2) {
          status = 'warning';
        }
        
        reportsToInsert.push({
          lake_id: lake.id,
          status,
          source: 'forecast',
          temperature_avg: Math.round(avgTemp * 10) / 10,
          wind_speed_avg: Math.round(avgWind * 10) / 10,
          raw_text: `7-day forecast: ${freezingHours} freezing hours, avg temp ${avgTemp.toFixed(1)}°C, avg wind ${avgWind.toFixed(1)} m/s`,
          scraped_at: new Date().toISOString(),
          valid_from: new Date().toISOString(),
          valid_until: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hour validity
        });
        
        // Small delay to respect rate limits
        await new Promise(r => setTimeout(r, 100));
        
      } catch (error) {
        console.error(`Error fetching forecast for ${lake.name}:`, error);
      }
    }

    // Insert forecast reports
    if (reportsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('ice_reports')
        .upsert(reportsToInsert, {
          onConflict: 'lake_id,source,scraped_at',
          ignoreDuplicates: true,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
      }
    }

    // Log the fetch
    await supabase.from('scrape_logs').insert({
      source: 'forecast',
      status: 'success',
      lakes_updated: forecasts.length,
      duration_ms: Date.now() - startTime,
      raw_response: { forecasts },
    });

    return new Response(
      JSON.stringify({
        success: true,
        forecasts_generated: forecasts.length,
        duration_ms: Date.now() - startTime,
      }),
      { headers }
    );

  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
      }),
      { status: 500, headers }
    );
  }
});

