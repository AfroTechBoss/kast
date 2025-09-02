# kast
The Info-Fi Layer of Farcaster

## Getting Started

### 1. Environment Setup

Copy the environment template and configure your variables:

```bash
cp .env.local.example .env.local
```

**Important**: Get a WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/) and add it to your `.env.local`:

```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_actual_project_id_here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) with your browser to see the result.
