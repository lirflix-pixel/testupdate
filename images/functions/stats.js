// netlify/functions/stats.js
exports.handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const action = url.searchParams.get("action") || "view";
    const slug = url.searchParams.get("slug") || "";
    const n = parseInt(url.searchParams.get("n") || "5", 10);

    const base = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!base || !token) {
      return json({ error: "Upstash non configuré" }, 500);
    }

    const call = (cmd) =>
      fetch(`${base}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(cmd),
      }).then((r) => r.json());

    if (action === "top") {
      const res = await call([
        ["HGETALL", "views"],
        ["HGETALL", "clicks"],
      ]);

      const toMap = (arr) => {
        const m = {};
        (arr || []).forEach((v, i) => {
          if (i % 2 === 0) m[v] = parseInt(arr[i + 1], 10) || 0;
        });
        return m;
      };

      const views = toMap(res[0]?.result || []);
      const clicks = toMap(res[1]?.result || []);
      const all = new Set([...Object.keys(views), ...Object.keys(clicks)]);

      const rows = [...all].map((s) => ({
        slug: s,
        views: views[s] || 0,
        clicks: clicks[s] || 0,
        score: (views[s] || 0) + (clicks[s] || 0) * 2,
      }));

      rows.sort((a, b) => b.score - a.score);
      return json({ top: rows.slice(0, n) });
    }

    if (!slug) return json({ error: "slug manquant" }, 400);

    const field = action === "click" ? "clicks" : "views";
    const inc = await call([["HINCRBY", field, slug, 1]]);
    return json({ ok: true, field, slug, value: inc[0]?.result ?? 0 });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
};

function json(body, status = 200) {
  return {
    statusCode: status,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
