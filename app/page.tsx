'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity,
  Brain,
  Server,
  Award,
  ArrowUpDown,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';

interface WeightsData {
  schema_version: string;
  timestamp: number;
  block: number;
  data: {
    header: string[];
    rows: any[][];
    stats: {
      eligible_count: number;
      active_count: number;
      queryable_count: number;
      total_miners: number;
    };
    env_winners: Record<string, string>;
    environments: string[];
  };
}

interface ModelRow {
  uid: number;
  hotkey: string;
  model: string;
  revision: string;
  environments: Record<string, string>;
  layerPoints: Record<string, number>;
  totalPoints: number;
  eligible: boolean;
  firstBlock: number;
  weight: number;
  avgEnvScore: number | null;
  totalSamples: number;
}

export default function AffineDashboard() {
  const [weightsData, setWeightsData] = useState<WeightsData | null>(null);
  const [models, setModels] = useState<ModelRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('weight');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [taoPrice, setTaoPrice] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | 'eligible'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch TAO price from CoinGecko
  const fetchTaoPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bittensor&vs_currencies=usd');
      const data = await response.json();
      if (data.bittensor && data.bittensor.usd) {
        setTaoPrice(data.bittensor.usd);
      }
    } catch (error) {
      console.error('Error fetching TAO price:', error);
    }
  };

  // Fetch data from API
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://dashboard.affine.io/api/weights');
      const data: WeightsData = await response.json();
      setWeightsData(data);
      
      // Parse rows into model objects
      const parsedModels: ModelRow[] = data.data.rows.map((row) => {
        const headerMap: Record<string, number> = {};
        data.data.header.forEach((h, i) => headerMap[h] = i);
        
        const environments: Record<string, string> = {};
        data.data.environments.forEach(env => {
          environments[env] = row[headerMap[env]] || '';
        });

        // Calculate average environment score and total samples
        const parseEnvScore = (scoreStr: string) => {
          if (!scoreStr || scoreStr === '') return null;
          const parts = scoreStr.split('/');
          if (parts.length < 1) return null;
          const accuracy = parseFloat(parts[0].replace('*', ''));
          return isNaN(accuracy) ? null : accuracy;
        };

        const parseTotalSamples = (scoreStr: string) => {
          if (!scoreStr || scoreStr === '') return 0;
          const parts = scoreStr.split('/');
          if (parts.length < 3) return 0;
          const samples = parseInt(parts[2]);
          return isNaN(samples) ? 0 : samples;
        };

        const scores = Object.values(environments)
          .map(parseEnvScore)
          .filter((score): score is number => score !== null);
        
        const avgEnvScore = scores.length > 0 
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
          : null;

        const totalSamples = Object.values(environments)
          .reduce((sum, env) => sum + parseTotalSamples(env), 0);

        return {
          uid: row[headerMap['UID']],
          hotkey: row[headerMap['Hotkey']],
          model: row[headerMap['Model']],
          revision: row[headerMap['Rev']],
          environments,
          layerPoints: {
            L3: row[headerMap['L3']] || 0,
            L4: row[headerMap['L4']] || 0,
            L5: row[headerMap['L5']] || 0,
            L6: row[headerMap['L6']] || 0,
            L7: row[headerMap['L7']] || 0,
            L8: row[headerMap['L8']] || 0,
          },
          totalPoints: row[headerMap['Pts']] || 0,
          eligible: row[headerMap['Elig']] === 'Y',
          firstBlock: row[headerMap['FirstBlk']],
          weight: row[headerMap['Wgt']] || 0,
          avgEnvScore,
          totalSamples,
        };
      });

      setModels(parsedModels);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTaoPrice();
    
    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(fetchData, 10000);
    // Refresh TAO price every 5 minutes
    const priceInterval = setInterval(fetchTaoPrice, 300000);
    return () => {
      clearInterval(interval);
      clearInterval(priceInterval);
    };
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortData = (data: ModelRow[]) => {
    return [...data].sort((a, b) => {
      let aVal: any = a[sortField as keyof ModelRow];
      let bVal: any = b[sortField as keyof ModelRow];
      
      // Special handling for avgEnvScore to treat null as -Infinity (lowest value)
      if (sortField === 'avgEnvScore') {
        const aScore = aVal !== null ? aVal : -Infinity;
        const bScore = bVal !== null ? bVal : -Infinity;
        return sortDirection === 'asc' ? aScore - bScore : bScore - aScore;
      }
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal === undefined || aVal === null) aVal = 0;
      if (bVal === undefined || bVal === null) bVal = 0;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return sortDirection === 'asc' 
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  };

  const filterData = (data: ModelRow[]) => {
    let filtered = data;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.hotkey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.uid.toString().includes(searchQuery)
      );
    }
    
    // Apply tab filter
    if (selectedTab === 'eligible') {
      filtered = filtered.filter(item => item.eligible);
    }
    
    return filtered;
  };

  const filteredAndSorted = sortData(filterData(models));

  // Get stats
  const stats = weightsData?.data.stats || {
    eligible_count: 0,
    active_count: 0,
    queryable_count: 0,
    total_miners: 0,
  };

  const totalWeight = models.reduce((sum, m) => sum + m.weight, 0);

  if (isLoading && !weightsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-xl text-gray-600 dark:text-gray-400">Loading Affine data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AFFINE
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center space-x-2">
                <span>Bittensor Subnet 120</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Activity size={14} className="text-green-500 animate-pulse" />
                  <span className="text-green-600 dark:text-green-400 font-semibold">LIVE</span>
                </span>
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Block</p>
                <p className="text-lg font-bold font-mono">#{weightsData?.block.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">TAO Price</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {taoPrice !== null ? `$${taoPrice.toFixed(2)}` : 'Loading...'}
                </p>
              </div>
              <button 
                onClick={fetchData}
                disabled={isLoading}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Miners</p>
                <p className="text-3xl font-bold">{stats.total_miners}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Brain className="text-blue-600 dark:text-blue-400" size={28} />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span>{stats.active_count} active</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Eligible</p>
                <p className="text-3xl font-bold">{stats.eligible_count}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="text-green-600 dark:text-green-400" size={28} />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span>{((stats.eligible_count / stats.total_miners) * 100).toFixed(1)}% of total</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-purple-200 dark:border-purple-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Queryable</p>
                <p className="text-3xl font-bold">{stats.queryable_count}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Server className="text-purple-600 dark:text-purple-400" size={28} />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span>Ready to serve</span>
            </div>
          </motion.div>
        </div>

        {/* Environments Info */}
        {weightsData?.data.environments && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <Target className="mr-2" size={24} />
                  Active Environments
                </h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  {weightsData.data.environments.map(env => (
                    <span key={env} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                      {env.split(':')[1] || env}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3">
                  <p className="text-xs opacity-80 mb-1">Environments</p>
                  <p className="text-2xl font-bold">{weightsData.data.environments.length}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Models Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          {/* Tabs and Search */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedTab('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedTab === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All Models ({models.length})
                </button>
                <button
                  onClick={() => setSelectedTab('eligible')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedTab === 'eligible'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={16} />
                    <span>Eligible ({stats.eligible_count})</span>
                  </div>
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-64"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
              <span>{filteredAndSorted.length} models</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button onClick={() => handleSort('uid')} className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300">
                      <span>UID</span>
                      <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hotkey
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button onClick={() => handleSort('totalPoints')} className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300">
                      <span>Points</span>
                      <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button onClick={() => handleSort('avgEnvScore')} className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300">
                      <span>Avg Env Score</span>
                      <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button onClick={() => handleSort('totalSamples')} className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300">
                      <span>Total Samples</span>
                      <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Layer Scores
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button onClick={() => handleSort('weight')} className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300">
                      <span>Weight</span>
                      <ArrowUpDown size={14} />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Age (Days)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSorted.slice(0, 50).map((model, index) => (
                  <motion.tr
                    key={model.uid}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(index * 0.01, 0.5) }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index < 3 && model.weight > 0 && (
                          <Award 
                            size={18} 
                            className={`mr-2 ${
                              index === 0 ? 'text-yellow-500' : 
                              index === 1 ? 'text-gray-400' : 
                              'text-orange-600'
                            }`} 
                          />
                        )}
                        <span className="text-sm font-bold">{model.uid}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {model.model}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {model.revision.substring(0, 8)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded font-mono">
                          {model.hotkey.substring(0, 12)}...
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {model.totalPoints}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {model.avgEnvScore !== null ? (
                          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            {model.avgEnvScore.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                            N/A
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                          {model.totalSamples.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-xs">
                        {Object.entries(model.layerPoints).map(([layer, points]) => (
                          points > 0 && (
                            <span 
                              key={layer}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded"
                              title={`${layer}: ${points}`}
                            >
                              {layer}: {points}
                            </span>
                          )
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" 
                            style={{ width: `${Math.min((model.weight / (totalWeight / models.length)) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{(model.weight * 100).toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {model.eligible ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 flex items-center space-x-1">
                            <CheckCircle size={12} />
                            <span>Eligible</span>
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400">
                            Not Eligible
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Clock size={14} className="text-blue-500" />
                        <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                          {(() => {
                            const currentBlock = weightsData?.block || 0;
                            const blockDiff = currentBlock - model.firstBlock;
                            const days = ((blockDiff * 12) / 86400).toFixed(2);
                            return `${days} days`;
                          })()}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Info */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {Math.min(50, filteredAndSorted.length)} of {filteredAndSorted.length} models
              </p>
              <a 
                href="https://dashboard.affine.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>View on dashboard.affine.io</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 pb-8 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          Bittensor Affine Subnet (SN120) · Data from{' '}
          <a href="https://dashboard.affine.io/api/weights" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
            dashboard.affine.io/api/weights
          </a>
          {' '}· Auto-refreshes every 10 seconds
        </p>
      </footer>
    </div>
  );
}
