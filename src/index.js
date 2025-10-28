import { Hono } from 'hono';

// Hono App ကို ဖန်တီးခြင်း
const app = new Hono();

// Key Name တစ်ခုကို စာရင်းအဖြစ် သိမ်းဆည်းထားဖို့ သတ်မှတ်
const KV_KEY = 'user_posts';

// Hono ကို fetch handler အဖြစ် export လုပ်မယ်
export default app;

// CORS headers များကို ထည့်သွင်းပေးခြင်း။ (Frontend မှ ခေါ်ဆိုနိုင်ရန်)
app.use('*', async (c, next) => {
    const response = await next();
    response.headers.set('Access-Control-Allow-Origin', '*'); 
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
});


// 1. GET / Endpoint: သိမ်းဆည်းထားတဲ့ စာတွေကို JSON နဲ့ ပြပေးမယ်
app.get('/', async (c) => {
  const env = c.env;
  const posts = await env.KPWEB_CONFIG.get(KV_KEY, 'json');

  if (!posts) {
    return c.json({ status: 'ok', message: 'No posts found.', posts: [] });
  }

  return c.json({
    status: 'ok',
    posts: posts
  });
});


// 2. POST /save Endpoint: User ရိုက်ထည့်တဲ့စာကို KV ထဲမှာ သိမ်းဆည်းပေးမယ်
app.post('/save', async (c) => {
  const env = c.env;
  const { content } = await c.req.json();

  if (!content || content.trim().length === 0) {
    return c.json({ status: 'error', message: 'Content is required.' }, 400);
  }

  let posts = await env.KPWEB_CONFIG.get(KV_KEY, 'json');

  if (!posts || !Array.isArray(posts)) {
    posts = []; 
  }

  const newPost = {
    id: Date.now().toString(),
    content: content,
    timestamp: new Date().toISOString()
  };
  posts.unshift(newPost);

  await env.KPWEB_CONFIG.put(KV_KEY, JSON.stringify(posts)); 

  return c.json({ status: 'success', message: 'Post saved successfully.', newPost: newPost });
});


// 3. Pre-flight OPTIONS request များကို Handle လုပ်ပေးခြင်း (CORS အတွက်)
app.options('*', (c) => {
    return c.text('', 204); 
});

// 4. အခြားသော URL များအတွက် Response
app.all('*', (c) => {
  return c.text('404 Not Found. Use GET / or POST /save', 404);
});
