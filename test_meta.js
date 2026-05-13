const cred = {
  phone_number_id: '1118036628058712',
  access_token: 'EAASS003kNAYBRWz0GJD0miVfYrbHhvhMxJEdDCaYwUahCLIYUfPPL1TZBbUzDIANfjKRbuXlpMzlAGcXo29xNpyr4V1VEO6BpZClRVGEERqTzm8CUTug6WaZAZB2ajMB61ZCgZB49rdipLdePbxxk05gtoIAzNInZCObf54h7XzKr0BLp01Uyanuhb27XqHWgZDZD'
};
const toPhone = '5513991766472';

async function test() {
  console.log('Sending message...');
  const metaRes = await fetch(
    `https://graph.facebook.com/v25.0/${cred.phone_number_id}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cred.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'text',
        text: { body: 'Teste NODEJS direto' },
      }),
    }
  );

  const data = await metaRes.json();
  console.log('STATUS:', metaRes.status);
  console.log('DATA:', data);
}

test();
