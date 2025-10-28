// netlify/functions/verify.js
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const SECRET = process.env.FOS_SIGNING_SECRET || "DEMO_SECRET_CHANGE_ME";

function verifySignature(canonical, signature) {
  const expected = crypto.createHmac("sha256", SECRET).update(canonical).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signature, "utf8"));
  } catch {
    return false;
  }
}

exports.handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const id = url.searchParams.get("id") || "sample-001";
    const mode = url.searchParams.get("mode") || "read";

    // توجه: به لطف included_files در netlify.toml، این مسیر در زمان اجرا در دسترس است
    const file = path.join(process.cwd(), "dossier", `${id}.signed.json`);
    if (!fs.existsSync(file)) {
      return { statusCode: 404, body: JSON.stringify({ error: "not_found", message: `No dossier for id=${id}` }) };
    }
    const claim = JSON.parse(fs.readFileSync(file, "utf8"));

    if (mode === "verify") {
      const ok = verifySignature(claim.canonical, claim.signature);
      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, valid: ok, payload: claim.payload, signature: claim.signature, meta: claim.meta })
      };
    }

    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(claim) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "server_error", message: err.message }) };
  }
};
