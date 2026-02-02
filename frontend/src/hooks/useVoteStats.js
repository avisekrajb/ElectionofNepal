import { useState, useEffect } from 'react';
import { getVoteStats, getRecentVotes } from '../api/voteApi';

const useVoteStats = () => {
  const [voteStats, setVoteStats] = useState({
    totalVotes: 0,
    votesByCandidate: [],
    recentVotes: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsResponse, recentResponse] = await Promise.all([
        getVoteStats(),
        getRecentVotes()
      ]);

      if (statsResponse.success && recentResponse.success) {
        setVoteStats({
          totalVotes: statsResponse.data.totalVotes,
          votesByCandidate: statsResponse.data.votesByCandidate,
          recentVotes: recentResponse.data
        });
        setError(null);
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch vote stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const refetch = () => {
    fetchStats();
  };

  return { voteStats, loading, error, refetch };
};

export default useVoteStats;