/**
 * Worker ကို အသစ်ရေးသောအခါ၊ Binding များကို 'env' (Environment) Object မှတဆင့် ရယူသည်။
 * KPWEB_CONFIG ဆိုတာကို wrangler.toml မှာ Binding လုပ်ခဲ့တဲ့ နာမည်ပါ။
 */

// Worker Environment (Binding များကို သိမ်းဆည်းထားသည့် နေရာ) အတွက် Interface
// JavaScript တွင်မလိုအပ်သော်လည်း ရှင်းလင်းစေရန် ရေးသားထားသည်။
// TypeScript သုံးပါက အောက်ပါအတိုင်း သုံးနိုင်သည်။
/*
interface Env {
  KPWEB_CONFIG: KVNamespace;
}
*/

export default {
  /**
   * အဝင် HTTP Request တစ်ခုကို လက်ခံသော fetch event handler
   * @param {Request} request အဝင် Request
   * @param {any} env KV Binding များအပါအဝင် Environment Variables များ
   */
  async fetch(request, env) {
    // 1. KV Binding ကို အသုံးပြုပြီး 'website_title' key ရဲ့ value ကို ခေါ်ယူခြင်း
    // 'KPWEB_CONFIG' သည် wrangler.toml တွင် သတ်မှတ်ခဲ့သော binding name ဖြစ်သည်။
    // .get() သည် Promise ကို ပြန်ပေးသောကြောင့် await သုံးရန် လိုအပ်သည်။
    const websiteTitle = await env.KPWEB_CONFIG.get("website_title");

    // 2. 'config_data' key ကိုလည်း ဆွဲထုတ်ကြည့်နိုင်သည်
    const configData = await env.KPWEB_CONFIG.get("config_data");

    // 3. တွေ့ရှိသော တန်ဖိုးများကို စစ်ဆေးပြီး Response ပြန်ပေးခြင်း
    if (websiteTitle) {
      return new Response(
        `KV Data Successfully Fetched:\n- Website Title: ${websiteTitle}\n- Config Data: ${configData}`,
        {
          headers: { 'content-type': 'text/plain' },
        }
      );
    } else {
      // Key မတွေ့ရှိပါက Response
      return new Response("Error: 'website_title' not found in KV or Binding setup failed.", {
        status: 404,
        headers: { 'content-type': 'text/plain' },
      });
    }
  },
};
