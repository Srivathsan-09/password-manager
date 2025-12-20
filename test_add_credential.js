const http = require('http');

// First login to get token
function request(path, method, body, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

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
        console.log('1. Logging in...');
        const loginRes = await request('/api/auth/login', 'POST', {
            masterPassword: 'password123'
        });
        console.log('Login Status:', loginRes.status);
        console.log('Login Body:', loginRes.body);

        const loginData = JSON.parse(loginRes.body);
        if (!loginData.token) {
            console.error('No token received. Cannot proceed.');
            return;
        }

        const token = loginData.token;
        console.log('\n2. Adding credential...');
        const addRes = await request('/api/credentials', 'POST', {
            appName: 'Google',
            username: 'srimana2006@gmail.com',
            password: 'Srivathsan2006@',
            notes: 'Additional details...'
        }, token);

        console.log('Add Credential Status:', addRes.status);
        console.log('Add Credential Body:', addRes.body);

        if (addRes.status === 200) {
            console.log('\n✓ SUCCESS: Credential added successfully!');
        } else {
            console.error('\n✗ FAILED: Could not add credential');
        }

    } catch (e) {
        console.error('Test Error:', e);
    }
}

test();
