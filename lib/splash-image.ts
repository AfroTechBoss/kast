import { NextRequest } from 'next/server';

// Splash image configuration
export interface SplashImageConfig {
  imageUrl: string;
  backgroundColor: string;
  title?: string;
  description?: string;
}

// Default splash configuration
const DEFAULT_SPLASH: SplashImageConfig = {
  imageUrl: 'https://github.com/AfroTechBoss/images/blob/main/kastpbw.png',
  backgroundColor: '#ffffff',
  title: 'Kast',
  description: 'The Info-Fi Layer of Farcaster'
};

// Campaign-specific splash configuration
const CAMPAIGN_SPLASH: SplashImageConfig = {
  imageUrl: 'https://github.com/AfroTechBoss/images/blob/main/kastpbw.png',
  backgroundColor: '#f0f9ff',
  title: 'Kast Campaign',
  description: 'Join the campaign and earn rewards'
};

/**
 * Determines the splash image configuration based on the request context
 */
export function getSplashImageConfig(request: NextRequest, campaignId?: string): SplashImageConfig {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Check if this is a campaign-related page
  if (campaignId || pathname.includes('/campaign/') || pathname.includes('/campaigns/')) {
    return {
      ...CAMPAIGN_SPLASH,
      title: campaignId ? `Campaign ${campaignId}` : 'Kast Campaign'
    };
  }

  // Default to main app splash
  return DEFAULT_SPLASH;
}

/**
 * Generates splash image metadata for frame embeds
 */
export function generateSplashImageMeta(config: SplashImageConfig) {
  return {
    'fc:frame:image': config.imageUrl,
    'fc:frame:image:aspect_ratio': '1:1',
    'fc:frame:splash:image_url': config.imageUrl,
    'fc:frame:splash:background_color': config.backgroundColor,
    'og:image': config.imageUrl,
    'og:title': config.title,
    'og:description': config.description
  };
}

/**
 * Creates a dynamic splash image URL based on context
 */
export function createDynamicSplashUrl(baseUrl: string, context: {
  type: 'main' | 'campaign' | 'custom';
  campaignId?: string;
  customImage?: string;
}): string {
  const params = new URLSearchParams();
  params.set('type', context.type);
  
  if (context.campaignId) {
    params.set('campaignId', context.campaignId);
  }
  
  if (context.customImage) {
    params.set('customImage', context.customImage);
  }

  return `${baseUrl}/api/splash-image?${params.toString()}`;
}

/**
 * Generates SVG splash image with dynamic content
 */
export function generateSplashImageSVG(config: SplashImageConfig): string {
  return `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="${config.backgroundColor}"/>
      <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" 
            font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#000">
        ${config.title || 'Kast'}
      </text>
      <text x="100" y="130" text-anchor="middle" dominant-baseline="middle" 
            font-family="Arial, sans-serif" font-size="12" fill="#666">
        ${config.description || 'Mini App'}
      </text>
    </svg>
  `;
}