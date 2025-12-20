const http = require('http');

function request(path, method, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function test() {
    try {
        console.log('Checking Init Status...');
        const initRes = await request('/init', 'POST');
        console.log('Init Response:', initRes.body);

        const initData = JSON.parse(initRes.body);
        if (initData.initialized) {
            console.log('App is already initialized. Cannot test setup failure.');
            return;
        }

        console.log('Attempting Setup...');
        const setupRes = await request('/setup', 'POST', {
            masterPassword: 'password123',
            securityQuestion: 'Test Question',
            securityAnswer: 'Test Answer'
        });
        console.log('Setup Response Status:', setupRes.status);
        console.log('Setup Response Body:', setupRes.body);

    } catch (e) {
        console.error('Test Error:', e);
    }
}

test();
