// /api/verify.js  (Serverless Function on Vercel)
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// همین مقدار را در Vercel هم به عنوان Environment Variable ست می‌کنی
const SECRET = process.env.FOS_SIGNING_SECRET || "DEMO_SECRET_CHANGE_ME";

function verifySignature(canonical, signature){
  const expected = crypto.createHmac("sha256", SECRET).update(canonical).digest("hex");
  try{
    return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signature, "utf8"));
  }catch{
    return false;
  }
}

module.exports = async (req, res) => {
  try{
    const { id = "sample-001", mode = "read" } = req.query || {};
    // فایل‌های امضاشده را از پوشه dossier می‌خوانیم
    const file = path.join(process.cwd(), "dossier", `${id}.signed.json`);
    if(!fs.existsSync(file)){
      return res.status(404).json({ error: "not_found", message: `No dossier for id=${id}` });
    }
    const claim = JSON.parse(fs.readFileSync(file, "utf8"));

    if(mode === "verify"){
      const ok = verifySignature(claim.canonical, claim.signature);
      return res.status(200).json({ id, valid: ok, payload: claim.payload, signature: claim.signature, meta: claim.meta });
    }

    // حالت read: خود فایل امضاشده را برمی‌گردانیم
    return res.status(200).json(claim);
  }catch(err){
    return res.status(500).json({ error: "server_error", message: err.message });
  }
};
