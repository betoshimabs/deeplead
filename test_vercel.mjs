async function run() {
  const res = await fetch('https://deeplead-chi.vercel.app/api/conversations/2544196a-c3e5-49cc-8586-253c391c6906', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: 'Teste VERCEL direct fetch',
      sender_type: 'agent'
    })
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}
run();
