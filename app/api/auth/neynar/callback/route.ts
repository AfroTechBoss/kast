import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 400 })
  }

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.neynar.com/v2/farcaster/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEYNAR_API_KEY}`
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/neynar/callback`
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Get user info from Neynar
    const userResponse = await fetch('https://api.neynar.com/v2/farcaster/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!userResponse.ok) {
      throw new Error('Failed to get user info')
    }

    const userData = await userResponse.json()
    const user = {
      fid: userData.fid,
      username: userData.username,
      displayName: userData.display_name,
      pfpUrl: userData.pfp_url,
      custodyAddress: userData.custody_address,
      verifications: userData.verifications || []
    }

    // Store user data temporarily (in production, use a proper session store)
    // For now, we'll use a simple in-memory store with the nonce as key
    global.authSessions = global.authSessions || new Map()
    global.authSessions.set(state, { user, timestamp: Date.now() })

    // Return success page that closes the popup
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #10b981; }
          </style>
        </head>
        <body>
          <h1 class="success">✓ Authentication Successful</h1>
          <p>You can now close this window.</p>
          <script>
            // Notify parent window and close popup
            if (window.opener) {
              window.opener.postMessage({ type: 'NEYNAR_AUTH_SUCCESS', nonce: '${state}' }, '*')
            }
            setTimeout(() => window.close(), 2000)
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('Neynar auth callback error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}