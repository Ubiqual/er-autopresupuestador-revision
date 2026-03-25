require('dotenv').config();
const axios = require('axios');

async function getAuth0ManagementToken() {
  const auth0Domain = process.env.AUTH0_DOMAIN;
  const auth0ClientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID;
  const auth0ClientSecret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET;

  const tokenResponse = await axios.post(`https://${auth0Domain}/oauth/token`, {
    client_id: auth0ClientId,
    client_secret: auth0ClientSecret,
    audience: `https://${auth0Domain}/api/v2/`,
    grant_type: 'client_credentials'
  });

  return tokenResponse.data.access_token;
}

async function updateAuth0URLs() {
  const auth0Domain = process.env.AUTH0_DOMAIN;
  const auth0ClientId = process.env.AUTH0_CLIENT_ID;
  const auth0ManagementToken = await getAuth0ManagementToken();

  // Fetch existing client data from Auth0
  const clientData = await axios.get(`https://${auth0Domain}/api/v2/clients/${auth0ClientId}`, {
    headers: {
      Authorization: `Bearer ${auth0ManagementToken}`
    }
  });

  // Get current Vercel deployment URL
  const currentDeploymentURL = `https://${process.env.VERCEL_URL}`;

  const callbackURL = `${currentDeploymentURL}/api/auth/callback`;
  const logoutURL = currentDeploymentURL;

  const existingCallbacks = clientData.data.callbacks || [];
  const existingLogoutURLs = clientData.data.allowed_logout_urls || [];

  // Update callbacks if needed
  if (!existingCallbacks.includes(callbackURL)) {
    const updatedCallbacks = [...existingCallbacks, callbackURL];

    await axios.patch(
      `https://${auth0Domain}/api/v2/clients/${auth0ClientId}`,
      { callbacks: updatedCallbacks },
      { headers: { Authorization: `Bearer ${auth0ManagementToken}` } }
    );
  }

  // Update allowed logout URLs if needed
  if (!existingLogoutURLs.includes(logoutURL)) {
    const updatedLogoutURLs = [...existingLogoutURLs, logoutURL];

    await axios.patch(
      `https://${auth0Domain}/api/v2/clients/${auth0ClientId}`,
      { allowed_logout_urls: updatedLogoutURLs },
      { headers: { Authorization: `Bearer ${auth0ManagementToken}` } }
    );
  }
}

updateAuth0URLs().catch((error) => {
  console.error('Error updating Auth0 URLs:', error);
});
