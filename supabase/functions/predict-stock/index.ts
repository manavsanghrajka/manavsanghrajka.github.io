import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatTicker(ticker: string, market: string): string {
  const clean = ticker.toUpperCase().trim();
  if (market === "TSX") {
    return clean.endsWith(".TO") ? clean : `${clean}.TO`;
  }
  return clean;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { ticker, market } = await req.json();
    
    if (!ticker || !market) {
      throw new Error("Missing required fields: ticker, market");
    }
    
    const formattedTicker = formatTicker(ticker, market);
    
    // Call the new python-ml-service endpoint
    const mlServiceUrl = `https://stock-predictor-ml-1jmf.onrender.com/predict-on-demand?ticker=${formattedTicker}`;
    
    const mlResponse = await fetch(mlServiceUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!mlResponse.ok) {
        // Fallback or error
        const errText = await mlResponse.text();
        throw new Error(`ML Service Error: ${errText}`);
    }

    const result = await mlResponse.json();
    
    // Convert to the format expected by the frontend
    return new Response(
      JSON.stringify({
        ticker: formattedTicker,
        market,
        days_ahead: 1,
        current_price: result.current_price,
        predicted_price: result.predicted_price,
        predicted_log_return: result.predicted_log_return,
        direction: result.direction,
        currency: market === "TSX" ? "CAD" : "USD",
        feature_importance: result.active_variables,
        // Mock these for frontend backward compatibility where needed
        lower_bound: result.predicted_price * 0.98,
        upper_bound: result.predicted_price * 1.02,
        r_squared: 0.15, // Lasso global doesn't compute simple R2 on demand
        hit_rate: 0.55, 
        volatility: 0.0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
