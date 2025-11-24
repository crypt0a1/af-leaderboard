# Bittensor Affine Subnet Dashboard

A real-time leaderboard and analytics dashboard for Bittensor Affine Subnet (SN120). Track AI models, performance metrics, environments, and rewards. Inspired by [affine.io](https://www.affine.io/).

## Features

- 🤖 **AI Models Leaderboard** - Live tracking of AI models and their performance
- 🏆 **Ranking System** - Models ranked by score with award badges for top 3
- ✅ **Eligibility Tracking** - Filter models by eligibility status
- 🌍 **Environment Management** - Track Production, Staging, and Testing environments
- 💰 **Alpha Pricing** - Display alpha prices per inference
- 💎 **Rewards System** - Track TAO emissions and rewards per model
- 📊 **Performance Metrics** - Monitor accuracy, latency, and scores
- 🔍 **Search & Filter** - Find models by name, provider, or UID
- ↕️ **Sortable Tables** - Sort by any metric (score, accuracy, latency, rewards)
- 📈 **Network Statistics** - Real-time block number and TAO price
- 🌓 **Dark Mode** - Built-in dark mode support
- 📱 **Responsive Design** - Works on all devices
- ⚡ **Auto-refresh** - Data updates every 30 seconds
- 🎯 **LIVE Indicator** - Real-time status monitoring

## Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Charts:** Recharts

## Getting Started

1. **Install dependencies:**

```bash
npm install
```

2. **Run the development server:**

```bash
npm run dev
```

3. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Dashboard Features

### Header
- **LIVE Status** - Real-time connection indicator
- **Block Number** - Current blockchain block
- **TAO Price** - Live TAO cryptocurrency price
- **Refresh Button** - Manual data refresh

### Network Overview Cards
- **Active Models** - Total number of AI models in the subnet
- **Eligible Models** - Models eligible for rewards
- **Environments** - Production-ready models count
- **Alpha Price** - Average price per inference

### Rewards Banner
- Total rewards distributed this epoch
- APY estimate display
- Visual gradient design

### Models Leaderboard
- **All Models Tab** - View all registered models
- **Eligible Tab** - Filter to show only reward-eligible models
- **Production Tab** - Show only production environment models
- Sortable columns (Rank, Score, Accuracy, Latency, Price, Rewards)
- Visual progress bars for scores
- Environment badges (Production/Staging/Testing)
- Top 3 rankings highlighted with trophy icons
- Active/Offline status with eligibility indicators

### Search & Filter
- Search by model name, provider, or UID
- Real-time filtering across tabs
- Results counter

## Data Structure

### Model Fields
- `rank` - Model ranking position
- `modelId` - Unique model identifier
- `name` - Model name (e.g., GPT-4-Turbo, Claude-3-Opus)
- `provider` - Model provider/operator
- `uid` - Unique identifier in subnet
- `score` - Overall performance score (0-100)
- `accuracy` - Model accuracy percentage (0-1)
- `latency` - Response latency in milliseconds
- `eligible` - Eligibility for rewards (boolean)
- `emissions` - TAO rewards received
- `alphaPrice` - Alpha price per inference
- `environment` - Deployment environment (Production/Staging/Testing)
- `isActive` - Current online status

## API Integration

This dashboard now uses **real live data** from the official Affine subnet API:

**API Endpoint:** [https://dashboard.affine.io/api/weights](https://dashboard.affine.io/api/weights)

The API returns:
- Current block number
- All registered models with their UIDs, hotkeys, and weights
- Performance metrics across multiple environments
- Layer points (L3-L8)
- Eligibility status
- Statistics (total miners, eligible count, active count, queryable count)
- Environment winners

Data auto-refreshes every 30 seconds to keep the leaderboard up-to-date.

## Build for Production

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env.local` file for configuration:

```env
NEXT_PUBLIC_SUBNET_ID=120
NEXT_PUBLIC_RPC_ENDPOINT=your_rpc_endpoint
NEXT_PUBLIC_REFRESH_INTERVAL=30000
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this for your own Bittensor subnet dashboard.

## Resources

- [Affine.io](https://www.affine.io/) - Official Affine Subnet Dashboard
- [Bittensor Documentation](https://docs.bittensor.com)
- [Subnet 120 Details](https://learnbittensor.org/subnets)
- [SubnetStats](https://www.subnetstats.app/) - Subnet analytics platform
- [TorchRank](https://bittensor.torchrank.com/) - Validator and subnet metrics

