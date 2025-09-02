import { NextRequest, NextResponse } from 'next/server';

// Generate dynamic Frame images
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId') || '1';

  // For now, return a simple SVG image
  // In production, you might want to generate dynamic images based on campaign data
  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#000000;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#9B59B6;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bg)" />
      
      <!-- KAST Logo/Title -->
      <text x="600" y="200" font-family="Arial, sans-serif" font-size="80" font-weight="bold" text-anchor="middle" fill="white">
        KAST
      </text>
      
      <!-- Campaign Info -->
      <text x="600" y="280" font-family="Arial, sans-serif" font-size="32" text-anchor="middle" fill="#E0E0E0">
        Farcaster Reward Campaign
      </text>
      
      <!-- Campaign ID -->
      <text x="600" y="340" font-family="Arial, sans-serif" font-size="28" text-anchor="middle" fill="#9B59B6">
        Campaign #${campaignId}
      </text>
      
      <!-- Call to Action -->
      <text x="600" y="420" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white">
        Earn rewards by creating amazing content
      </text>
      
      <!-- Bottom Text -->
      <text x="600" y="480" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="#B0B0B0">
        Click to join and start earning!
      </text>
      
      <!-- Decorative Elements -->
      <circle cx="200" cy="150" r="40" fill="#9B59B6" opacity="0.3" />
      <circle cx="1000" cy="480" r="60" fill="#9B59B6" opacity="0.2" />
      <circle cx="100" cy="500" r="30" fill="white" opacity="0.1" />
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}