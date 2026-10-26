// Vercel serverless function: reads the channel's public YouTube feed and returns JSON.
const CHANNEL_ID = "UCqzQLXoEIv3MBNWv08Sm0Ow";

function decode(s) {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
}

function parse(xml) {
  const out = [];
  const re = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = re.exec(xml))) {
    const e = m[1];
    const id = (/<yt:videoId>([^<]+)<\/yt:videoId>/.exec(e) || [])[1];
    const title = (/<title>([\s\S]*?)<\/title>/.exec(e) || [])[1];
    const date = (/<published>([^<]+)<\/published>/.exec(e) || [])[1];
    if (id && title) out.push({ id, title: decode(title.trim()), date: date || "" });
  }
  return out;
}

module.exports = async (req, res) => {
  try {
    const r = await fetch(
      "https://www.youtube.com/feeds/videos.xml?channel_id=" + CHANNEL_ID,
      { headers: { "user-agent": "Mozilla/5.0 (compatible; ToonifySite/1.0)" } }
    );
    if (!r.ok) throw new Error("feed " + r.status);
    const videos = parse(await r.text());
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");
    res.status(200).json({ videos });
  } catch (err) {
    res.status(502).json({ videos: [], error: String(err && err.message || err) });
  }
};
