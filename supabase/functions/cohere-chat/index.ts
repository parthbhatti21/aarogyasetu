// Supabase Edge Function: Cohere Chat Proxy
// This function proxies requests to Cohere API securely without exposing the API key to clients

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; message: string }>;
  language?: string;
  sessionId?: string;
}

interface CohereMessage {
  role: "USER" | "CHATBOT";
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Cohere API key from Supabase secrets
    const COHERE_API_KEY = Deno.env.get("COHERE_API_KEY");
    if (!COHERE_API_KEY) {
      throw new Error("COHERE_API_KEY not configured");
    }

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Parse request body
    const { message, conversationHistory = [], language = "en", sessionId }: ChatRequest =
      await req.json();

    if (!message) {
      throw new Error("Message is required");
    }

    // Build conversation history for Cohere
    const chatHistory: CohereMessage[] = conversationHistory.map((msg) => ({
      role: msg.role === "user" ? "USER" : "CHATBOT",
      message: msg.message,
    }));

    // System preamble for patient registration context
    const preamble = language === "hi"
      ? `आप एक सहायक स्वास्थ्य देखभाल सहायक हैं जो रोगी पंजीकरण में मदद करते हैं। आपका काम है:
1. रोगी की जानकारी एकत्र करना (नाम, उम्र, लिंग, संपर्क विवरण)
2. चिकित्सा इतिहास के बारे में पूछना (एलर्जी, पुरानी स्थितियां, वर्तमान दवाएं)
3. वर्तमान लक्षणों और मुख्य शिकायतों को समझना
4. दयालु, स्पष्ट और संक्षिप्त रहें
5. एक समय में एक प्रश्न पूछें
6. रोगी को सहज महसूस कराएं`
      : `You are a helpful healthcare assistant helping with patient registration. Your job is to:
1. Collect patient information (name, age, gender, contact details)
2. Ask about medical history (allergies, chronic conditions, current medications)
3. Understand current symptoms and chief complaints
4. Be empathetic, clear, and concise
5. Ask one question at a time
6. Make the patient feel comfortable

Extract structured data from the conversation and provide it in a consistent format.`;

    // Call Cohere API
    const cohereResponse = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "command-r-plus",
        message: message,
        chat_history: chatHistory,
        preamble: preamble,
        temperature: 0.7,
        max_tokens: 500,
        connectors: [],
      }),
    });

    if (!cohereResponse.ok) {
      const errorText = await cohereResponse.text();
      console.error("Cohere API error:", errorText);
      throw new Error(`Cohere API error: ${cohereResponse.status}`);
    }

    const cohereData = await cohereResponse.json();

    // Log conversation to database if sessionId provided
    if (sessionId) {
      const newMessages = [
        ...conversationHistory,
        { role: "user", content: message, timestamp: new Date().toISOString() },
        { role: "assistant", content: cohereData.text, timestamp: new Date().toISOString() },
      ];

      // Check if conversation exists
      const { data: existingConv } = await supabaseClient
        .from("ai_conversations")
        .select("id, messages")
        .eq("session_id", sessionId)
        .single();

      if (existingConv) {
        // Update existing conversation
        await supabaseClient
          .from("ai_conversations")
          .update({
            messages: newMessages,
            updated_at: new Date().toISOString(),
          })
          .eq("session_id", sessionId);
      } else {
        // Create new conversation
        await supabaseClient.from("ai_conversations").insert({
          session_id: sessionId,
          messages: newMessages,
          language: language,
          completed: false,
        });
      }
    }

    // Return response
    return new Response(
      JSON.stringify({
        success: true,
        message: cohereData.text,
        sessionId: sessionId,
        metadata: {
          finishReason: cohereData.finish_reason,
          citations: cohereData.citations,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error.message === "Unauthorized" ? 401 : 500,
      }
    );
  }
});
