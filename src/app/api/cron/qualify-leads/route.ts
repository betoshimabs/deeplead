import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_DEEPLEAD_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY!;

// Initialize Supabase Admin client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Force dynamic execution for CRON
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Authorization check (optional for cron, but recommended)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Find up to 50 conversations with unanalyzed messages
    const { data: rawConversations, error: convsError } = await supabaseAdmin
      .from('messaging.messages')
      .select('conversation_id')
      .eq('ai_analyzed', false)
      .limit(1000); // Fetch enough to find distinct

    if (convsError) throw convsError;
    if (!rawConversations || rawConversations.length === 0) {
      return NextResponse.json({ message: 'No unanalyzed messages found' });
    }

    // Extract unique conversation IDs, limited to 50
    const uniqueConvIds = Array.from(new Set(rawConversations.map(c => c.conversation_id))).slice(0, 50);

    const promises = uniqueConvIds.map(async (conversationId) => {
      try {
        // Fetch conversation details to get the lead_id and business_id
        const { data: conv } = await supabaseAdmin
          .schema('messaging')
          .from('conversations')
          .select('id, lead_id, business_id')
          .eq('id', conversationId)
          .single();

        if (!conv || !conv.lead_id) return { conversationId, status: 'skipped (no lead)' };

        // Fetch lead and contact data
        const { data: lead } = await supabaseAdmin
          .schema('crm')
          .from('leads')
          .select('id, contact_id, monthly_income, occupation, marital_status, dependents_count, employment_type, notes')
          .eq('id', conv.lead_id)
          .single();

        if (!lead) return { conversationId, status: 'skipped (lead not found)' };

        const { data: contact } = await supabaseAdmin
          .schema('crm')
          .from('contacts')
          .select('id, name, city')
          .eq('id', lead.contact_id)
          .single();

        // 2. Fetch the actual messages (both analyzed context and unanalyzed target)
        const { data: unanalyzedMsgs } = await supabaseAdmin
          .schema('messaging')
          .from('messages')
          .select('id, sender_type, content, created_at')
          .eq('conversation_id', conversationId)
          .eq('ai_analyzed', false)
          .order('created_at', { ascending: true });

        if (!unanalyzedMsgs || unanalyzedMsgs.length === 0) return { conversationId, status: 'no unanalyzed messages' };

        const { data: analyzedMsgs } = await supabaseAdmin
          .schema('messaging')
          .from('messages')
          .select('id, sender_type, content, created_at')
          .eq('conversation_id', conversationId)
          .eq('ai_analyzed', true)
          .order('created_at', { ascending: false })
          .limit(5);

        // Prepare context and current data for AI
        const contextMessages = (analyzedMsgs || []).reverse().map(m => `[${m.sender_type.toUpperCase()}] (contexto): ${m.content}`);
        const targetMessages = unanalyzedMsgs.map(m => `[${m.sender_type.toUpperCase()}] (NOVA): ${m.content}`);
        const formattedTranscript = [...contextMessages, ...targetMessages].join('\n');

        const currentData = {
          renda_mensal: lead.monthly_income,
          ocupacao: lead.occupation,
          estado_civil: lead.marital_status,
          dependentes: lead.dependents_count,
          tipo_emprego: lead.employment_type,
          cidade: contact?.city
        };

        const systemPrompt = `Você é um extrator de dados estrito para um CRM Imobiliário. Sua função é preencher a Ficha do Lead retornando UM JSON VÁLIDO.
REGRAS:
1. Só atualize informações declaradas pelo [LEAD] nas mensagens (NOVA). Ignore completamente suposições ou perguntas do [AGENTE].
2. SOBRESCRITA: Se o campo já estiver preenchido (não for null no DADOS ATUAIS), SÓ sobrescreva o valor atual SE o Lead EXPLICITAMENTE corrigi-lo ou atualizá-lo na nova mensagem. Se a informação nova não conflitar, não altere o campo atual.
3. Se a informação não couber nos campos exatos, mas for muito relevante para o negócio, crie uma frase resumida e objetiva em 'new_notes'. Se não houver nada relevante, deixe 'new_notes' null.
4. O JSON deve ter exatamente a estrutura abaixo, preenchendo apenas o que mudou ou foi descoberto. Para campos que não mudaram ou não foram citados, você OBRIGATORIAMENTE não deve retorná-los ou deve retornar null.

{
  "fields_to_update": {
    "monthly_income": number | null,
    "occupation": string | null,
    "marital_status": string | null,
    "dependents_count": number | null,
    "employment_type": string | null,
    "city": string | null
  },
  "new_notes": string | null
}`;

        // 3. Call DeepSeek v4 Flash via Fetch API
        const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": \`Bearer \${DEEPSEEK_API_KEY}\`
          },
          body: JSON.stringify({
            model: "deepseek-v4-flash",
            response_format: { type: "json_object" },
            temperature: 0.1,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: \`DADOS ATUAIS:\\n\${JSON.stringify(currentData, null, 2)}\\n\\nMENSAGENS:\\n\${formattedTranscript}\` }
            ]
          })
        });

        if (!dsRes.ok) {
          const errText = await dsRes.text();
          console.error(\`DeepSeek API Error for \${conversationId}:\`, errText);
          return { conversationId, status: 'error', detail: errText };
        }

        const dsData = await dsRes.json();
        let aiResult;
        try {
          aiResult = JSON.parse(dsData.choices[0].message.content);
        } catch (e) {
          console.error(\`Failed to parse JSON for \${conversationId}:\`, dsData.choices[0].message.content);
          return { conversationId, status: 'error', detail: 'invalid JSON' };
        }

        // 4. Update Database
        const fields = aiResult.fields_to_update || {};
        const leadUpdates: any = {};
        const contactUpdates: any = {};

        if (fields.monthly_income !== undefined && fields.monthly_income !== null) leadUpdates.monthly_income = fields.monthly_income;
        if (fields.occupation !== undefined && fields.occupation !== null) leadUpdates.occupation = fields.occupation;
        if (fields.marital_status !== undefined && fields.marital_status !== null) leadUpdates.marital_status = fields.marital_status;
        if (fields.dependents_count !== undefined && fields.dependents_count !== null) leadUpdates.dependents_count = fields.dependents_count;
        if (fields.employment_type !== undefined && fields.employment_type !== null) leadUpdates.employment_type = fields.employment_type;

        if (fields.city !== undefined && fields.city !== null) contactUpdates.city = fields.city;

        let hasUpdates = Object.keys(leadUpdates).length > 0 || Object.keys(contactUpdates).length > 0 || aiResult.new_notes;

        if (Object.keys(leadUpdates).length > 0) {
          await supabaseAdmin.schema('crm').from('leads').update(leadUpdates).eq('id', conv.lead_id);
        }

        if (Object.keys(contactUpdates).length > 0 && contact?.id) {
          await supabaseAdmin.schema('crm').from('contacts').update(contactUpdates).eq('id', contact.id);
        }

        if (aiResult.new_notes) {
          const existingNotes = lead.notes ? \`\${lead.notes}\\n\\n\` : '';
          const updatedNotes = \`\${existingNotes}*[IA Qualificação]: \${aiResult.new_notes}*\`;
          await supabaseAdmin.schema('crm').from('leads').update({ notes: updatedNotes }).eq('id', conv.lead_id);
        }

        // 5. Mark messages as analyzed
        const unanalyzedIds = unanalyzedMsgs.map(m => m.id);
        await supabaseAdmin
          .schema('messaging')
          .from('messages')
          .update({ ai_analyzed: true })
          .in('id', unanalyzedIds);

        // 6. Broadcast update if something was changed so UI updates
        if (hasUpdates) {
          await supabaseAdmin.channel(\`business_chat_\${conv.business_id}\`).send({
            type: 'broadcast',
            event: 'conversation_updated',
            payload: { conversation_id: conversationId },
          });
        }

        return { conversationId, status: 'success', hasUpdates };
      } catch (err: any) {
        console.error(\`Exception processing \${conversationId}:\`, err);
        return { conversationId, status: 'error', detail: err.message };
      }
    });

    const results = await Promise.all(promises);

    return NextResponse.json({ 
      message: \`Processed \${uniqueConvIds.length} conversations\`,
      results 
    });

  } catch (err: any) {
    console.error('Fatal Cron Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
