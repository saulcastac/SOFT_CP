
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load env from root manually
const envPath = path.resolve(__dirname, '../.env');
let envs: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line: string) => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;

        // Remove 'export ' if present
        if (line.startsWith('export ')) {
            line = line.substring(7).trim();
        }

        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, ''); // unquote
            envs[key] = value;
        }
    });
} else {
    console.log('No .env file found at', envPath);
}

const USERNAME = envs.FACTURAMA_USERNAME || envs.NEXT_PUBLIC_FACTURAMA_USERNAME;
const PASSWORD = envs.FACTURAMA_PASSWORD || envs.NEXT_PUBLIC_FACTURAMA_PASSWORD;

if (!USERNAME || !PASSWORD) {
    console.error('Missing FACTURAMA_USERNAME or FACTURAMA_PASSWORD in .env');
    console.log('Found keys:', Object.keys(envs));
    process.exit(1);
}

const CREDENTIALS = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

async function testEndpoint(baseUrl: string, prefix: string, catalog: string, query: string) {
    const url = `${baseUrl}/${prefix}/catalogs/${catalog}${query}`;
    console.log(`\nTesting: ${url}`);

    return new Promise<void>((resolve) => {
        const req = https.request(url, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${CREDENTIALS}`
            }
        }, (res: any) => {
            console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
            let data = '';
            res.on('data', (chunk: any) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log(`Body length: ${data.length}`);
                console.log(`Body (first 200): ${data.substring(0, 200).replace(/\r/g, '\\r').replace(/\n/g, '\\n')}`);
                try {
                    if (data.trim().startsWith('[')) {
                        const json = JSON.parse(data);
                        console.log(`Items found: ${json.length}`);
                    }
                } catch (e) { }
                resolve();
            });
        });

        req.on('error', (e: any) => {
            console.error('Request error:', e.message);
            resolve();
        });

        req.end();
    });
}

async function run() {
    console.log('--- Starting Facturama Debug ---');
    console.log(`User: ${USERNAME}`);

    // Check if password seems valid (not empty)
    console.log(`Password length: ${PASSWORD ? PASSWORD.length : 0}`);

    const keyword = 'Zapato';
    // Test 1: Production, api-lite (Current implementation)
    await testEndpoint('https://api.facturama.mx', 'api-lite', 'ProductsOrServices', `?keyword=${keyword}`);

    // Test 2: Production, api (Standard)
    await testEndpoint('https://api.facturama.mx', 'api', 'ProductsOrServices', `?keyword=${keyword}`);

    // Test 3: Sandbox, api-lite
    await testEndpoint('https://apisandbox.facturama.mx', 'api-lite', 'ProductsOrServices', `?keyword=${keyword}`);
}

run();
