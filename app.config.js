// Load environment variables
require('dotenv').config({ path: '.env.local' });

// KAST App Configuration
module.exports = {
  // App Info
  app: {
    name: 'KAST',
    version: '1.0.0',
    description: 'Farcaster mini-app for reward campaigns',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://getkast.xyz',
  },

  // Farcaster Configuration
  farcaster: {
    hubUrl: process.env.FARCASTER_HUB_URL || 'https://nemes.farcaster.xyz:2281',
    apiKey: process.env.FARCASTER_API_KEY,
    frameBaseUrl: process.env.NEXT_PUBLIC_FRAME_BASE_URL || 'https://getkast.xyz/frames',
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/kast',
    ssl: process.env.NODE_ENV === 'production',
    maxConnections: 20,
  },

  // Blockchain Configuration
  blockchain: {
    network: 'base',
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    chainId: 8453,
    contracts: {
      escrow: process.env.ESCROW_CONTRACT_ADDRESS,
      rewards: process.env.REWARDS_CONTRACT_ADDRESS,
      badges: process.env.BADGES_CONTRACT_ADDRESS,
    },
  },

  // Scoring Configuration
  scoring: {
    basePoints: {
      cast: 10,
      meme: 15,
      explainer: 18,
      reply: 5,
    },
    engagementWeights: {
      likes: 0.4,
      recasts: 1.0,
      replies: 0.3,
      uniqueEngagers: 1.2,
    },
    limits: {
      maxPointsPerDay: 120,
      maxSubmissionsPerCampaign: 12,
      minAccountAge: 14, // days
    },
  },

  // UI Configuration
  ui: {
    theme: {
      colors: {
        primary: {
          black: '#000000',
          white: '#FFFFFF',
          purple: '#9B59B6',
        },
      },
    },
    mobile: {
      maxWidth: '448px', // max-w-md
      breakpoint: '640px',
    },
  },

  // Feature Flags
  features: {
    enableModeration: true,
    enableAnalytics: true,
    enableBadges: true,
    enableExport: true,
  },

  // Rate Limiting
  rateLimits: {
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window
    },
    campaigns: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // campaign creations per hour
    },
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    corsOrigins: [
      'https://warpcast.com',
      'https://farcaster.xyz',
      process.env.NEXT_PUBLIC_APP_URL,
    ],
  },

  // External Services
  services: {
    ipfs: {
      gateway: 'https://ipfs.io/ipfs/',
      pinataApiKey: process.env.PINATA_API_KEY,
      pinataSecretKey: process.env.PINATA_SECRET_KEY,
    },
    analytics: {
      enabled: process.env.NODE_ENV === 'production',
      trackingId: process.env.ANALYTICS_TRACKING_ID,
    },
  },
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
  module.exports.database.ssl = false;
  module.exports.security.corsOrigins.push('http://localhost:3000');
}

if (process.env.NODE_ENV === 'test') {
  module.exports.database.url = 'postgresql://localhost:5432/kast_test';
  module.exports.rateLimits.api.max = 1000;
}