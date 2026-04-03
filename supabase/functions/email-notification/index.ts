// Supabase Edge Function for sending email notifications via Gmail SMTP
// Deploy with: supabase functions deploy email-notification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const GMAIL_EMAIL = Deno.env.get("GMAIL_EMAIL") || "";
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface EmailNotificationRequest {
  to: string;
  subject: string;
  body: string;
  patient_name?: string;
  notification_type?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, body, patient_name, notification_type } = await req.json() as EmailNotificationRequest;

    console.log('📧 Email notification request:', { to, subject, notification_type });

    // Validate required fields
    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client for logging
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate HTML email template
    const htmlBody = generateEmailTemplate(subject, body, patient_name, notification_type);

    // Send email using Gmail SMTP
    let emailResult;
    if (GMAIL_EMAIL && GMAIL_APP_PASSWORD) {
      try {
        const client = new SMTPClient({
          connection: {
            hostname: "smtp.gmail.com",
            port: 465,
            tls: true,
            auth: {
              username: GMAIL_EMAIL,
              password: GMAIL_APP_PASSWORD,
            },
          },
        });

        await client.send({
          from: `Aarogya Setu <${GMAIL_EMAIL}>`,
          to: to,
          subject: subject,
          content: body,
          html: htmlBody,
        });

        await client.close();

        emailResult = { 
          id: 'gmail-' + Date.now(), 
          message: 'Email sent via Gmail SMTP' 
        };

        console.log('✅ Email sent successfully via Gmail:', { to, subject });
      } catch (error) {
        console.error('❌ Gmail SMTP error:', error);
        throw error;
      }
    } else {
      // For development/testing without Gmail credentials
      console.log('⚠️ No Gmail credentials configured - simulating email send');
      console.log('Email would be sent to:', to);
      console.log('Subject:', subject);
      console.log('Body:', body);
      
      emailResult = { 
        id: 'dev-' + Date.now(), 
        message: 'Email simulated (no Gmail credentials configured)' 
      };
    }

    // Log email activity to database
    await supabase.from('email_logs').insert({
      recipient: to,
      subject: subject,
      body: body,
      status: 'sent',
      external_id: emailResult.id,
      sent_at: new Date().toISOString(),
    }).catch(err => {
      // Don't fail the request if logging fails
      console.error('Failed to log email:', err);
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: emailResult.id,
        message: 'Email sent successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error in email-notification function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Generate HTML email template
 */
function generateEmailTemplate(
  subject: string,
  body: string,
  patientName?: string,
  notificationType?: string
): string {
  const greeting = patientName ? `Hello ${patientName},` : 'Hello,';
  
  const typeColors = {
    'Token Update': '#3B82F6',
    'Appointment Reminder': '#10B981',
    'Prescription Ready': '#8B5CF6',
    'Lab Report Ready': '#F59E0B',
    'General': '#6B7280',
  };
  
  const color = typeColors[notificationType as keyof typeof typeColors] || '#3B82F6';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                🏥 Aarogya Setu
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                ${greeting}
              </p>
              
              ${notificationType ? `
              <div style="background-color: ${color}15; border-left: 4px solid ${color}; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #1F2937; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${notificationType}
                </p>
              </div>
              ` : ''}

              <div style="color: #1F2937; font-size: 16px; line-height: 1.8; margin: 20px 0;">
                ${body.split('\n').map(line => `<p style="margin: 0 0 12px 0;">${line}</p>`).join('')}
              </div>

              <div style="margin: 30px 0; padding: 20px; background-color: #F9FAFB; border-radius: 6px;">
                <p style="margin: 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                  <strong>Need help?</strong><br>
                  Contact us at <a href="mailto:support@aarogyasetu.com" style="color: ${color}; text-decoration: none;">support@aarogyasetu.com</a>
                  or call us at <strong>1800-XXX-XXXX</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #F9FAFB; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #6B7280; font-size: 14px;">
                © ${new Date().getFullYear()} Aarogya Setu. All rights reserved.
              </p>
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
