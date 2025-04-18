import fetch from 'node-fetch';
import { CookieJar } from 'tough-cookie';
import { HttpCookieAgent } from 'http-cookie-agent/http';

async function testLogin() {
  // Create a cookie jar to store cookies between requests
  const cookieJar = new CookieJar();
  
  // Create an HTTP agent that uses the cookie jar
  const agent = new HttpCookieAgent({ cookies: { jar: cookieJar } });
  
  try {
    // Try to login with admin credentials
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      }),
      agent: agent
    });

    if (!loginResponse.ok) {
      console.error(`Login failed with status: ${loginResponse.status}`);
      return;
    }

    // Extract and store cookies from the response headers
    const cookies = loginResponse.headers.get('set-cookie');
    if (cookies) {
      console.log('Received cookies:', cookies);
    } else {
      console.log('No cookies received in response');
    }

    const userData = await loginResponse.json();
    console.log('Login successful', userData);

    console.log('Cookie jar after login:', cookieJar.toJSON());

    // Now try to access the authenticated user endpoint with the same agent
    const userResponse = await fetch('http://localhost:5000/api/user', {
      agent: agent
    });

    if (!userResponse.ok) {
      console.error(`User fetch failed with status: ${userResponse.status}`);
      return;
    }

    const currentUser = await userResponse.json();
    console.log('Current user:', currentUser);

  } catch (error) {
    console.error('Error during test:', error);
  }
}

testLogin();