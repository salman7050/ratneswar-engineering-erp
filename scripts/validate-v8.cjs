const fs = require('fs');
const path = require('path');
const mustExist = [
  'netlify.toml', '.env.cloud.example', 'src/lib/ai/cloudflare.ts',
  'src/components/providers/cloud-sync-refresh.tsx',
  'src/app/(auth)/login/page.tsx', 'src/lib/supabase/server.ts'
];
let failed = false;
for (const rel of mustExist) {
  if (!fs.existsSync(path.join(process.cwd(), rel))) { console.error('[V8] Missing', rel); failed = true; }
}
const forbidden = ['AI_SETUP_WINDOWS.bat','AI_START_WINDOWS.bat','AI_INSTALL_AUTOSTART_WINDOWS.bat','START_ERP_WINDOWS.bat','FINAL_SETUP_WINDOWS.bat'];
for (const rel of forbidden) if (fs.existsSync(path.join(process.cwd(),rel))) { console.error('[V8] Local runtime file still present:', rel); failed = true; }
const ai = fs.readFileSync(path.join(process.cwd(),'src/lib/actions/ai-assistant-actions.ts'),'utf8');
if (/127\.0\.0\.1:11434|callOllama|Queued · Ollama/.test(ai)) { console.error('[V8] Local AI reference remains in assistant action.'); failed = true; }
if (failed) process.exit(1);
console.log('[V8] Cloud-only validation passed.');
