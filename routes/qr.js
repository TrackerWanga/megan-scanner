const {
    giftedId,
    removeFile
} = require('../gift');
const QRCode = require('qrcode');
const express = require('express');
const zlib = require('zlib');
const path = require('path');
const fs = require('fs');
const os = require('os');
let router = express.Router();
const pino = require("pino");
const {
    default: giftedConnect,
    useMultiFileAuthState,
    Browsers,
    delay,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const IDENTITIES = {
    falcon: {
        prefix: 'FALCON',
        emoji: '🦅',
        brandName: 'FALCON MD',
        tagline: 'Soar Higher. Strike Faster.',
        channelUrl: 'https://whatsapp.com/channel/0029VbCqTO3JuyAIVHsZ2w23',
        repoUrl: 'https://github.com/TrackerWanga/MEGAN-MD',
        groupInvite: 'JtORryQp3oj5FHherAAh5k'
    },
    megan: {
        prefix: 'MEGAN',
        emoji: '🌸',
        brandName: 'MEGAN MD',
        tagline: 'Grace Meets Power.',
        channelUrl: 'https://whatsapp.com/channel/0029VbCqTO3JuyAIVHsZ2w23',
        repoUrl: 'https://github.com/TrackerWanga/MEGAN-MD',
        groupInvite: 'JtORryQp3oj5FHherAAh5k'
    }
};

const getSessionDir = () => {
    const dir = path.join(os.tmpdir(), 'megan-sessions', 'qr');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
};

const getQRTemplate = (qrImage, identity) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>${identity.brandName} — QR Auth</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --accent:#c026d3;--accent2:#a21caf;--green:#34d399;
  --cyan:#22d3ee;--bg:#050510;--card:rgba(255,255,255,0.02);
  --border:rgba(255,255,255,0.06);--border-hi:rgba(192,38,211,0.35);
  --text:#f1f0ff;--text2:#8b8da8;--text3:#3d3f52;
  --glow:0 0 40px rgba(192,38,211,0.4);
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{
  font-family:'Rajdhani',sans-serif;
  background:var(--bg);color:var(--text);
  min-height:100vh;display:flex;align-items:center;justify-content:center;
  padding:20px;overflow:hidden;
}
.glow-orb{
  position:fixed;border-radius:50%;filter:blur(100px);pointer-events:none;
}
.orb1{width:600px;height:600px;background:rgba(192,38,211,0.08);top:-200px;left:-150px;}
.orb2{width:500px;height:500px;background:rgba(34,211,238,0.05);bottom:-150px;right:-100px;}
.wrap{position:relative;z-index:10;width:100%;max-width:440px;}
.nav-back{
  display:inline-flex;align-items:center;gap:8px;
  padding:10px 16px;border-radius:10px;
  background:var(--card);border:1px solid var(--border);
  color:var(--text2);text-decoration:none;font-size:.82rem;font-weight:600;
  margin-bottom:22px;transition:all .2s;font-family:'Orbitron',sans-serif;
  letter-spacing:.04em;
}
.nav-back:hover{color:var(--text);border-color:var(--border-hi);box-shadow:var(--glow);}
.card{
  background:rgba(10,10,30,0.8);
  border:1px solid var(--border);
  border-radius:24px;overflow:hidden;
  box-shadow:0 40px 80px rgba(0,0,0,.8),var(--glow);
  animation:up .5s ease both;
  backdrop-filter:blur(20px);
}
@keyframes up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
.card-head{
  padding:28px 28px 22px;
  background:linear-gradient(160deg,rgba(192,38,211,0.08) 0%,transparent 60%);
  border-bottom:1px solid var(--border);
}
.badge{
  display:inline-flex;align-items:center;gap:8px;
  padding:5px 14px;border-radius:100px;
  background:rgba(192,38,211,0.12);border:1px solid rgba(192,38,211,0.25);
  color:var(--accent);font-size:.7rem;font-weight:700;
  font-family:'Orbitron',monospace;letter-spacing:.06em;
  margin-bottom:14px;
}
.badge-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:blink 2s infinite;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
.card-title{font-size:1.5rem;font-weight:800;letter-spacing:-.02em;margin-bottom:6px;font-family:'Orbitron',sans-serif;}
.card-sub{font-size:.85rem;color:var(--text2);line-height:1.6;}
.card-body{padding:28px;}

.qr-wrap{
  position:relative;margin:0 auto 24px;
  width:270px;height:270px;
  display:flex;align-items:center;justify-content:center;
}
.qr-corners span{
  position:absolute;width:24px;height:24px;
  border-style:solid;border-color:var(--accent);
}
.qr-corners span:nth-child(1){top:0;left:0;border-width:3px 0 0 3px;border-radius:4px 0 0 0;}
.qr-corners span:nth-child(2){top:0;right:0;border-width:3px 3px 0 0;border-radius:0 4px 0 0;}
.qr-corners span:nth-child(3){bottom:0;left:0;border-width:0 0 3px 3px;border-radius:0 0 0 4px;}
.qr-corners span:nth-child(4){bottom:0;right:0;border-width:0 3px 3px 0;border-radius:0 0 4px 0;}
.scan-line{
  position:absolute;left:6px;right:6px;height:2px;
  background:linear-gradient(90deg,transparent,var(--accent),var(--cyan),var(--accent),transparent);
  animation:scan 2s ease-in-out infinite;z-index:2;
  box-shadow:0 0 16px var(--accent);
}
@keyframes scan{0%,100%{top:6px}50%{top:calc(100% - 8px)}}
.qr-inner{
  position:relative;z-index:1;
  width:calc(100% - 12px);height:calc(100% - 12px);
  border-radius:14px;overflow:hidden;
  background:white;padding:12px;
  box-shadow:0 0 50px rgba(192,38,211,0.3);
  animation:qrpulse 3s ease-in-out infinite;
}
@keyframes qrpulse{0%,100%{box-shadow:0 0 30px rgba(192,38,211,0.2)}50%{box-shadow:0 0 70px rgba(192,38,211,0.45)}}
.qr-inner img{width:100%;height:100%;display:block;}
.ring{
  position:absolute;inset:-8px;border-radius:20px;
  background:conic-gradient(from 0deg,var(--accent),var(--cyan),var(--accent2),var(--accent));
  animation:spin 5s linear infinite;z-index:0;opacity:.5;
}
@keyframes spin{to{transform:rotate(360deg)}}
.ring-mask{
  position:absolute;inset:-6px;border-radius:18px;background:var(--bg);
  z-index:0;
}

.timer-row{
  display:flex;align-items:center;justify-content:center;gap:10px;
  margin-bottom:18px;
  font-family:'Orbitron',monospace;font-size:.78rem;color:var(--text2);
}
#timer{
  font-size:.95rem;font-weight:800;color:var(--green);
  background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.25);
  padding:4px 14px;border-radius:6px;min-width:48px;text-align:center;
  transition:all .3s;
}
#timer.warn{color:#fbbf24;background:rgba(251,191,36,0.1);border-color:rgba(251,191,36,0.25);}
#timer.urgent{color:#f87171;background:rgba(248,113,113,0.1);border-color:rgba(248,113,113,0.25);animation:fblink .6s step-end infinite;}
@keyframes fblink{0%,100%{opacity:1}50%{opacity:.25}}

.steps{display:flex;flex-direction:column;gap:8px;margin-bottom:16px;}
.step{
  display:flex;align-items:center;gap:12px;
  padding:11px 14px;border-radius:11px;
  background:rgba(255,255,255,0.02);border:1px solid var(--border);
  font-size:.82rem;color:var(--text2);
}
.step-n{
  width:26px;height:26px;border-radius:50%;flex-shrink:0;
  background:rgba(192,38,211,0.12);border:1px solid rgba(192,38,211,0.25);
  display:flex;align-items:center;justify-content:center;
  font-family:'Orbitron',monospace;font-size:.65rem;font-weight:700;color:var(--accent);
}
.security{
  padding:12px 14px;border-radius:11px;
  background:rgba(52,211,153,0.04);border:1px solid rgba(52,211,153,0.15);
  font-size:.76rem;color:#6ee7b7;display:flex;align-items:flex-start;gap:8px;line-height:1.6;
}
.identity-badge{
  margin-top:14px;text-align:center;
  font-family:'Orbitron',sans-serif;font-size:.72rem;font-weight:700;
  color:var(--accent);letter-spacing:.08em;
  padding:8px;border-radius:8px;
  background:rgba(192,38,211,0.06);border:1px solid rgba(192,38,211,0.15);
}
@media(max-width:460px){.qr-wrap{width:230px;height:230px;}}
</style>
</head>
<body>
<div class="glow-orb orb1"></div>
<div class="glow-orb orb2"></div>
<div class="wrap">
  <a class="nav-back" href="/"><i class="fas fa-arrow-left"></i> BACK TO NEXUS</a>
  <div class="card">
    <div class="card-head">
      <div class="badge"><span class="badge-dot"></span> ${identity.prefix} QR ACTIVE</div>
      <h1 class="card-title">SCAN TO CONNECT</h1>
      <p class="card-sub">WhatsApp → Linked Devices → Scan this code</p>
    </div>
    <div class="card-body">
      <div class="qr-wrap">
        <div class="ring"></div>
        <div class="ring-mask"></div>
        <div class="qr-corners">
          <span></span><span></span><span></span><span></span>
        </div>
        <div class="scan-line"></div>
        <div class="qr-inner">
          <img src="${qrImage}" alt="WhatsApp QR Code"/>
        </div>
      </div>
      <div class="timer-row">
        <i class="fas fa-clock" style="color:var(--accent)"></i>
        EXPIRES IN <span id="timer">60</span> SEC
      </div>
      <div class="steps">
        <div class="step"><div class="step-n">01</div>Open <strong style="color:var(--text)">WhatsApp</strong> on your device</div>
        <div class="step"><div class="step-n">02</div>Tap <strong style="color:var(--text)">Menu → Linked Devices → Link a device</strong></div>
        <div class="step"><div class="step-n">03</div>Point camera at QR — session sent to your DM</div>
      </div>
      <div class="security"><i class="fas fa-lock" style="margin-top:2px;flex-shrink:0"></i> Zero credentials stored. QR expires after one use. Session delivered directly to your WhatsApp.</div>
      <div class="identity-badge">${identity.emoji} ${identity.brandName} &mdash; ${identity.tagline}</div>
    </div>
  </div>
</div>
<script>
let s=60;const t=document.getElementById('timer');
const iv=setInterval(()=>{s--;t.textContent=s;
  if(s<=10)t.className='urgent';else if(s<=20)t.className='warn';
  if(s<=0){clearInterval(iv);t.textContent='EXP';}
},1000);
</script>
</body>
</html>`;

router.get('/', async (req, res) => {
    const id = giftedId();
    const sessionDir = getSessionDir();
    const sessionPath = path.join(sessionDir, id);
    let prefixKey = (req.query.prefix || 'megan').toLowerCase();
    if (!IDENTITIES[prefixKey]) prefixKey = 'megan';
    const identity = IDENTITIES[prefixKey];
    let responseSent = false;
    let sessionCleanedUp = false;
    let sessionSent = false;
    let connectionInstance = null;

    const timeout = setTimeout(async () => {
        if (!responseSent) {
            res.status(503).json({ error: 'QR session timed out. Please try again.' });
            responseSent = true;
        }
        try { if (connectionInstance?.ws) await connectionInstance.ws.close(); } catch (_) {}
        await cleanUp();
    }, 120000);

    async function cleanUp() {
        clearTimeout(timeout);
        if (!sessionCleanedUp) {
            sessionCleanedUp = true;
            try { await removeFile(sessionPath); } catch (_) {}
        }
    }

    async function start() {
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        try {
            const sock = giftedConnect({
                version,
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: 'silent' }),
                browser: Browsers.macOS('Desktop'),
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 25000,
                retryRequestDelayMs: 2000
            });
            connectionInstance = sock;
            sock.ev.on('creds.update', saveCreds);

            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr && !responseSent) {
                    try {
                        const qrImg = await QRCode.toDataURL(qr, { margin: 1, width: 240 });
                        if (!res.headersSent) {
                            res.send(getQRTemplate(qrImg, identity));
                            responseSent = true;
                        }
                    } catch (e) {
                        console.error('[QR] QR gen error:', e.message);
                    }
                }

                if (connection === 'open' && !sessionSent) {
                    sessionSent = true;
                    try { await sock.groupAcceptInvite(identity.groupInvite); } catch (_) {}
                    await delay(3000);
                    try { await saveCreds(); } catch (_) {}

                    const credsJson = JSON.stringify(state.creds);
                    if (!credsJson || credsJson.length < 50) {
                        try { await sock.ws.close(); } catch (_) {}
                        await cleanUp();
                        return;
                    }
                    try {
                        const compressed = zlib.gzipSync(Buffer.from(credsJson)).toString('base64');
                        const uid = sock.user?.id;
                        if (uid) {
                            await sock.sendMessage(uid, { text: `${identity.prefix}~${compressed}` });
                            await delay(1500);
                            await sock.sendMessage(uid, {
                                text: `*${identity.emoji} ${identity.brandName} SESSION ${identity.emoji}*\n\n` +
                                      `🔒 *SECURITY WARNING*\n` +
                                      `DO NOT SHARE THIS SESSION ID WITH ANYONE!\n\n` +
                                      `───────────────────────\n\n` +
                                      `✨ *${identity.brandName}*\n` +
                                      `_"${identity.tagline}"_\n\n` +
                                      `📢 Join our channel:\n${identity.channelUrl}\n\n` +
                                      `🤖 Bot Repository:\n${identity.repoUrl}`
                            });
                        }
                    } catch (e) {
                        console.error('[QR] Send error:', e.message);
                    } finally {
                        try { await sock.ws.close(); } catch (_) {}
                        await delay(1000);
                        await cleanUp();
                    }
                }

                if (connection === 'close') {
                    const code = lastDisconnect?.error?.output?.statusCode;
                    if (code !== DisconnectReason.loggedOut && !sessionSent) {
                        await delay(3000);
                        start();
                    } else {
                        await cleanUp();
                    }
                }
            });

        } catch (err) {
            console.error('[QR] Fatal:', err.message);
            if (!responseSent && !res.headersSent) {
                res.status(500).json({ error: 'QR service temporarily unavailable.' });
                responseSent = true;
            }
            await cleanUp();
        }
    }

    try { await start(); } catch (e) {
        console.error('[QR] Top-level error:', e.message);
        await cleanUp();
        if (!responseSent && !res.headersSent) res.status(500).json({ error: 'Service Error' });
    }
});

module.exports = router;
