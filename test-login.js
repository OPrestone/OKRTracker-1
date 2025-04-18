const fetch = require('node-fetch');

async function testLogin() {
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
      credentials: 'include'
    });

    if (!loginResponse.ok) {
      console.error(`Login failed with status: ${loginResponse.status}`);
      return;
    }

    const userData = await loginResponse.json();
    console.log('Login successful', userData);

    // Now try to access the authenticated user endpoint
    const userResponse = await fetch('http://localhost:5000/api/user', {
      credentials: 'include'
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