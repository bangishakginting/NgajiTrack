import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

let activeGasUrl = process.env.VITE_API_URL || 'https://script.google.com/macros/s/AKfycbzmzg4_0dsCxwAx9JCpstBW46YXaZNfjdRNSlDl9s737aWT05t51vUJe4iYL0oBV_Kdrg/exec';

function gasProxyPlugin() {
  return {
    name: 'gas-proxy-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        // Endpoint untuk menyimpan URL Web App baru
        if (req.url === '/api/gas/set-url' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              if (typeof data.url === 'string') {
                activeGasUrl = data.url.trim();
                process.env.VITE_API_URL = activeGasUrl;

                // Tulis ke file .env di root proyek agar persisten saat restart server
                try {
                  const envPath = path.resolve(process.cwd(), '.env');
                  let envContent = '';
                  if (fs.existsSync(envPath)) {
                    envContent = fs.readFileSync(envPath, 'utf-8');
                  }
                  if (envContent.includes('VITE_API_URL=')) {
                    envContent = envContent.replace(/VITE_API_URL=.*/g, `VITE_API_URL="${activeGasUrl}"`);
                  } else {
                    envContent += `\nVITE_API_URL="${activeGasUrl}"\n`;
                  }
                  fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');
                } catch (envErr) {
                  console.warn('Gagal menulis ke .env:', envErr);
                }
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, activeUrl: activeGasUrl }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: err.message }));
            }
          });
          return;
        }

        // Endpoint untuk mengambil URL Web App saat ini
        if (req.url === '/api/gas/get-url' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ activeUrl: activeGasUrl || process.env.VITE_API_URL || '' }));
          return;
        }

        // Proxy utama ke Google Apps Script
        if (req.url === '/api/gas' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            let headerUrl = req.headers['x-gas-url'];
            if (Array.isArray(headerUrl)) headerUrl = headerUrl[0];

            let bodyGasUrl = '';
            try {
              const parsedBody = JSON.parse(body);
              if (parsedBody && parsedBody._gas_url) {
                bodyGasUrl = parsedBody._gas_url;
                delete parsedBody._gas_url;
                body = JSON.stringify(parsedBody);
              }
            } catch (_) {}

            const gasUrl = (headerUrl || bodyGasUrl || activeGasUrl || process.env.VITE_API_URL || '').trim();

            if (!gasUrl || !gasUrl.startsWith('https://script.google.com')) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                isGasNotReady: true,
                message: 'URL Google Apps Script belum diatur atau tidak valid.'
              }));
              return;
            }

            try {
              const gasRes = await fetch(gasUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body,
                redirect: 'follow',
              });

              const text = await gasRes.text();
              res.setHeader('Content-Type', 'application/json');

              try {
                const json = JSON.parse(text);
                res.end(JSON.stringify(json));
              } catch (parseErr) {
                const isFunctionMissing = text.includes('Script function not found') || text.includes('not found: doPost');
                res.end(JSON.stringify({
                  success: false,
                  isGasNotReady: true,
                  message: isFunctionMissing
                    ? 'Script function not found: doPost di Google Apps Script'
                    : 'Google Apps Script mengembalikan respons non-JSON (pastikan otorisasi akun Google selesai dan Who has access diset ke: Anyone).'
                }));
              }
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                isGasNotReady: true,
                message: err.message || 'Gagal menghubungi Google Apps Script'
              }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  const gasUrl = (process.env.VITE_API_URL || 'https://script.google.com/macros/s/AKfycbzmzg4_0dsCxwAx9JCpstBW46YXaZNfjdRNSlDl9s737aWT05t51vUJe4iYL0oBV_Kdrg/exec').trim();

  return {
    plugins: [react(), tailwindcss(), gasProxyPlugin()],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(gasUrl),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
