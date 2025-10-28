import { Hono } from 'hono';

// Hono App ကို ဖန်တီးခြင်း
const app = new Hono();

// Key Name တစ်ခုကို စာရင်းအဖြစ် သိမ်းဆည်းထားဖို့ သတ်မှတ်
const KV_KEY = 'user_posts';

// Worker Environment (Binding များကို သိမ်းဆည်းထားသည့် နေရာ) အတွက် Interface
// Env ထဲမှာ KPWEB_CONFIG ဆိုတဲ့ KV Namespace ကို ထည့်ထားတယ်
// သင့်ရဲ့ Binding Name ကို ပိုရှင်းအောင် 'USER_POSTS' လို့ မှတ်လိုက်ပါမယ်
// Hono ကို fetch handler အဖြစ် export လုပ်မယ်
export default app;

/**
 * 1. GET / Endpoint: သိမ်းဆည်းထားတဲ့ စာတွေကို Web သုံးသူတိုင်းကို ပြပေးမယ်
 * Cloudflare Worker URL (ဥပမာ: https://kpupload01.workers.dev/) ကို ဝင်လိုက်ရင် ဒီကနေ ပြပါမယ်
 */
app.get('/', async (c) => {
  const env = c.env;
  
  // KV Binding Name ကို 'KPWEB_CONFIG' အစား 'USER_POSTS' လို့ ယူသုံးလိုက်ပါမယ်
  // (သင် KV Binding Name ကို KPWEB_CONFIG လို့ပဲ ပေးထားဆဲမို့)
  const posts = await env.KPWEB_CONFIG.get(KV_KEY, 'json'); // JSON format နဲ့ ခေါ်ယူမယ်

  if (!posts) {
    // ပို့စ်များ မရှိသေးရင် အစမ်းစာရင်းတစ်ခု ဖန်တီးပေးမယ်
    return c.json({ status: 'ok', message: 'No posts found. Start by POSTing to /save', posts: [] });
  }

  // ရှိတဲ့ posts တွေကို ပြပေးမယ်
  return c.json({
    status: 'ok',
    posts: posts
  });
});


/**
 * 2. POST /save Endpoint: User ရိုက်ထည့်တဲ့စာကို KV ထဲမှာ သိမ်းဆည်းပေးမယ်
 * Frontend ကနေ ဒီ Endpoint ကို စာတွေ ပို့ရပါမယ်။
 */
app.post('/save', async (c) => {
  const env = c.env;
  
  // ဝင်လာတဲ့ Request Body ထဲက JSON ကို ယူမယ် (ဥပမာ: { "content": "Hello World" })
  const { content } = await c.req.json();

  if (!content) {
    return c.json({ status: 'error', message: 'Content is required.' }, 400);
  }

  // KV ကနေ လက်ရှိ posts တွေကို အရင်ဆုံး ဆွဲထုတ်မယ်
  let posts = await env.KPWEB_CONFIG.get(KV_KEY, 'json');

  if (!posts) {
    posts = []; // မရှိသေးရင် အသစ်စမယ်
  }

  // posts စာရင်းထဲကို post အသစ် ထပ်ထည့်မယ်
  const newPost = {
    id: Date.now().toString(),
    content: content,
    timestamp: new Date().toISOString()
  };
  posts.unshift(newPost); // အသစ်ကို အပေါ်ဆုံးက ထားမယ်

  // စာရင်းအသစ်ကို KV ထဲကို ပြန်ထည့်သိမ်းမယ်
  // 'json' အမျိုးအစားနဲ့ သိမ်းဆည်းရင် ပိုကောင်းပါတယ်
  await env.KPWEB_CONFIG.put(KV_KEY, JSON.stringify(posts)); 

  return c.json({ status: 'success', message: 'Post saved successfully.', newPost: newPost });
});


/**
 * 3. အခြားသော URL များအတွက် Response
 */
app.all('*', (c) => {
  return c.text('404 Not Found. Use GET / or POST /save', 404);
});
