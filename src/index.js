import { Hono } from 'hono';

// Hono App ကို ဖန်တီးခြင်း
const app = new Hono();

// Key Name တစ်ခုကို စာရင်းအဖြစ် သိမ်းဆည်းထားဖို့ သတ်မှတ်
const KV_KEY = 'user_posts';

// Hono ကို fetch handler အဖြစ် export လုပ်မယ်
export default app;

// CORS headers များကို ထည့်သွင်းပေးခြင်း။ 
// ဤအရာက သင့်ရဲ့ Website (Frontend) မှ Worker ကို အခက်အခဲမရှိ ခေါ်ဆိုနိုင်အောင် ကူညီပေးပါလိမ့်မယ်။
app.use('*', async (c, next) => {
    const response = await next();
    response.headers.set('Access-Control-Allow-Origin', '*'); // သင့်ရဲ့ Domain ကို ဤနေရာတွင် ထည့်ပါက ပိုကောင်းပါမည်။
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
});


/**
 * 1. GET / Endpoint: သိမ်းဆည်းထားတဲ့ စာတွေကို Web သုံးသူတိုင်းကို ပြပေးမယ်
 */
app.get('/', async (c) => {
  const env = c.env;
  
  // KV Binding Name: 'KPWEB_CONFIG' ကို အသုံးပြု
  const posts = await env.KPWEB_CONFIG.get(KV_KEY, 'json'); // JSON format နဲ့ ခေါ်ယူမယ်

  if (!posts) {
    // ပို့စ်များ မရှိသေးရင် အစမ်းစာရင်း (Empty Array) ပြန်ပေးမယ်
    return c.json({ status: 'ok', message: 'No posts found.', posts: [] });
  }

  // ရှိတဲ့ posts တွေကို ပြပေးမယ်
  return c.json({
    status: 'ok',
    posts: posts
  });
});


/**
 * 2. POST /save Endpoint: User ရိုက်ထည့်တဲ့စာကို KV ထဲမှာ သိမ်းဆည်းပေးမယ်
 */
app.post('/save', async (c) => {
  const env = c.env;
  
  // ဝင်လာတဲ့ Request Body ထဲက JSON ကို ယူမယ် (ဥပမာ: { "content": "Hello World" })
  const { content } = await c.req.json();

  if (!content || content.trim().length === 0) {
    return c.json({ status: 'error', message: 'Content is required.' }, 400);
  }

  // KV ကနေ လက်ရှိ posts တွေကို အရင်ဆုံး ဆွဲထုတ်မယ်
  let posts = await env.KPWEB_CONFIG.get(KV_KEY, 'json');

  if (!posts || !Array.isArray(posts)) {
    posts = []; // မရှိသေးရင် သို့မဟုတ် Array မဟုတ်ရင် အသစ်စမယ်
  }

  // posts စာရင်းထဲကို post အသစ် ထပ်ထည့်မယ်
  const newPost = {
    id: Date.now().toString(),
    content: content,
    timestamp: new Date().toISOString()
  };
  posts.unshift(newPost); // အသစ်ကို အပေါ်ဆုံးက ထားမယ်

  // စာရင်းအသစ်ကို KV ထဲကို ပြန်ထည့်သိမ်းမယ်
  // KV သည် စာသားကိုသာ သိမ်းဆည်းနိုင်သောကြောင့် JSON.stringify() ပြုလုပ်ရန် လိုအပ်သည်
  await env.KPWEB_CONFIG.put(KV_KEY, JSON.stringify(posts)); 

  return c.json({ status: 'success', message: 'Post saved successfully.', newPost: newPost });
});


/**
 * 3. Pre-flight OPTIONS request များကို Handle လုပ်ပေးခြင်း (CORS အတွက်)
 */
app.options('*', (c) => {
    return c.text('', 204); // No Content response
});

/**
 * 4. အခြားသော URL များအတွက် Response
 */
app.all('*', (c) => {
  return c.text('404 Not Found. Use GET / or POST /save', 404);
});
