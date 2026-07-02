async function getSalesforceToken() {
  const params = new URLSearchParams();

  params.append("grant_type", "client_credentials");
  params.append("client_id", process.env.SF_CLIENT_ID);
  params.append("client_secret", process.env.SF_CLIENT_SECRET);

  const response = await fetch(`${process.env.SF_LOGIN_URL}/services/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Salesforce Auth Error: ${error}`);
  }

  return response.json();
}

async function salesforceRequest(path, options = {}) {
  const auth = await getSalesforceToken();

  const response = await fetch(
    `${auth.instance_url}/services/data/${process.env.SF_API_VERSION}${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }
  );

  const data = await response.text();

  if (!response.ok) {
    throw new Error(`Salesforce API Error: ${data}`);
  }

  return data ? JSON.parse(data) : {};
}

module.exports = {
  salesforceRequest
};