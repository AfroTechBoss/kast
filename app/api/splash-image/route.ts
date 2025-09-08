import { NextRequest, NextResponse } from 'next/server';
import { getSplashImageConfig, generateSplashImageSVG } from '@/lib/splash-image';

// This route needs to be dynamic because it uses request.url
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'main';
    const campaignId = searchParams.get('campaignId');
    const customImage = searchParams.get('customImage');

    // Get splash configuration based on context
    let config = getSplashImageConfig(request, campaignId || undefined);

    // Override with custom image if provided
    if (customImage) {
      config = {
        ...config,
        imageUrl: customImage
      };
    }

    // Customize based on type
    switch (type) {
      case 'campaign':
        config = {
          ...config,
          backgroundColor: '#f0f9ff',
          title: campaignId ? `Campaign ${campaignId}` : 'Kast Campaign',
          description: 'Join the campaign and earn rewards'
        };
        break;
      case 'main':
      default:
        config = {
          ...config,
          backgroundColor: '#ffffff',
          title: 'Kast',
          description: 'The Info-Fi Layer of Farcaster'
        };
        break;
    }

    // Generate SVG splash image
    const svgContent = generateSplashImageSVG(config);

    // Return SVG response
    return new NextResponse(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error generating splash image:', error);
    
    // Return default splash image on error
    const defaultSvg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#ffffff"/>
        <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" 
              font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#000">
          Kast
        </text>
      </svg>
    `;
    
    return new NextResponse(defaultSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }
}