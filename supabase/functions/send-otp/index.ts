
import "https://deno.land/x/supabase_functions_js@1.0.0/edge-runtime.d.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return Response.json(
        { error: "Method not allowed" },
        { status: 405, headers: corsHeaders }
      );
    }

    const { phone, otp } = await req.json();

    if (
      typeof phone !== "string" ||
      !/^\+91\d{10}$/.test(phone) ||
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp)
    ) {
      return Response.json(
        { error: "Invalid phone number or OTP" },
        { status: 400, headers: corsHeaders }
      );
    }

    const apiKey = Deno.env.get("TEXTBEE_API_KEY");
    const deviceId = Deno.env.get("TEXTBEE_DEVICE_ID");

    if (!apiKey || !deviceId) {
      throw new Error("Textbee secrets are missing.");
    }

    const response = await fetch(
      "https://api.textbee.dev/api/v1/gateway/send-sms",
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId,
          recipients: [phone],
          message: `Your SpendWise OTP is: ${otp}. It expires in 5 minutes.`,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Textbee error:", response.status, result);

      return Response.json(
        { error: "Could not send OTP. Please try again." },
        { status: 502, headers: corsHeaders }
      );
    }

    return Response.json(
      { success: true, message: "OTP request accepted." },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Send OTP error:", error);

    return Response.json(
      { error: "Unable to send OTP." },
      { status: 500, headers: corsHeaders }
    );
  }
});
