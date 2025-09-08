import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const nonce = searchParams.get('nonce')

  if (!nonce) {
    return NextResponse.json({ error: 'Missing nonce parameter' }, { status: 400 })
  }

  try {
    // Check if authentication session exists
    const authSessions = global.authSessions || new Map()
    const session = authSessions.get(nonce)

    if (!session) {
      return NextResponse.json({ success: false, message: 'Authentication pending' })
    }

    // Check if session is not too old (5 minutes max)
    const maxAge = 5 * 60 * 1000 // 5 minutes
    if (Date.now() - session.timestamp > maxAge) {
      authSessions.delete(nonce)
      return NextResponse.json({ error: 'Authentication session expired' }, { status: 400 })
    }

    // Return user data and clean up session
    const user = session.user
    authSessions.delete(nonce)

    return NextResponse.json({ success: true, user })

  } catch (error) {
    console.error('Auth status check error:', error)
    return NextResponse.json({ error: 'Failed to check authentication status' }, { status: 500 })
  }
}