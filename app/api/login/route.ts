export async function POST(request: Request) {
  const { username, password } = await request.json();
  console.log('ENV:', process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD);
  console.log('RECEIVED:', username, password);
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    // Auth success
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }
  // Auth fail
  return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), { status: 401 });
}
