// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { getVoteStats, getAllVotes, getAgeStats, getCandidateStats } from '../api/voteApi';
import './AdminDashboard.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AdminDashboard = ({ onLogout }) => {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState('all');
  const [stats, setStats] = useState({
    totalVotes: 0,
    votesByCandidate: []
  });
  const [ageDistribution, setAgeDistribution] = useState(null);
  const [candidateDetails, setCandidateDetails] = useState([]);
  const [activeTab, setActiveTab] = useState('votes');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const candidates = [
    { id: "c1", name: "Gagan Thapa", party: "Nepali Congress", color: "#10B981" },
    { id: "c2", name: "K. P. Sharma Oli", party: "CPN (UML)", color: "#EF4444" },
    { id: "c3", name: "Balendra Shah (Balen)", party: "Rastriya Swatantra Party", color: "#0EA5E9" },
    { id: "c4", name: "Pushpa Kamal Dahal", party: "Nepali Communist Party", color: "#DC2626" },
    { id: "c5", name: "Madhav Kumar Nepal", party: "Nepali Communist Party", color: "#991B1B" },
    { id: "c6", name: "Baburam Bhattarai", party: "Pragatisheel Lokatantrik Party", color: "#8B5CF6" },
    { id: "c7", name: "Kulman Ghising", party: "Ujyalo Nepal Party", color: "#F59E0B" },
    { id: "c8", name: "Harka Sampang", party: "Shrama Sanskriti Party", color: "#F97316" },
    { id: "c9", name: "Rabi Lamichhane", party: "Rastriya Swatantra Party", color: "#14B8A6" },
    { id: "c10", name: "Sushila Karki", party: "Independent", color: "#059669" },
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    fetchAllData();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [votesResponse, statsResponse, ageResponse, candidateResponse] = await Promise.all([
        getAllVotes(),
        getVoteStats(),
        getAgeStats(),
        getCandidateStats()
      ]);

      if (votesResponse.success) setVotes(votesResponse.data);
      if (statsResponse.success) setStats({
        totalVotes: statsResponse.data.totalVotes,
        votesByCandidate: statsResponse.data.votesByCandidate
      });
      if (ageResponse.success) setAgeDistribution(ageResponse.data);
      if (candidateResponse.success) setCandidateDetails(candidateResponse.data);

    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVotes = votes.filter(vote => {
    const matchesSearch = searchTerm === '' || 
      vote.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vote.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vote.candidateParty.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCandidate = selectedCandidate === 'all' || 
      vote.candidateId === selectedCandidate;
    
    return matchesSearch && matchesCandidate;
  });

  const getCandidateColor = (candidateId) => {
    const candidate = candidates.find(c => c.id === candidateId);
    return candidate ? candidate.color : '#64748b';
  };

  const getCandidateVoteCount = (candidateId) => {
    if (candidateDetails && candidateDetails.length > 0) {
      const candidate = candidateDetails.find(c => c._id === candidateId);
      return candidate ? candidate.votes : 0;
    }
    return votes.filter(v => v.candidateId === candidateId).length;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Age', 'Candidate', 'Party', 'Voted At', 'IP Address'],
      ...filteredVotes.map(vote => [
        `"${vote.name}"`,
        vote.age,
        `"${vote.candidateName}"`,
        `"${vote.candidateParty}"`,
        `"${formatDate(vote.votedAt)}"`,
        vote.ipAddress
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `election-votes-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text('Nepal Election 2026 - Admin Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Votes: ${votes.length}`, 14, 37);
    
    // Add summary table
    doc.autoTable({
      startY: 45,
      head: [['Statistic', 'Value']],
      body: [
        ['Total Votes', votes.length],
        ['Candidates', candidates.length],
        ['Average Age', calculateAgeStats().avg],
        ['Youngest Voter', calculateAgeStats().min],
        ['Oldest Voter', calculateAgeStats().max]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });
    
    // Add candidate statistics
    doc.text('Candidate Statistics', 14, doc.autoTable.previous.finalY + 15);
    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 20,
      head: [['Candidate', 'Party', 'Votes', 'Percentage']],
      body: candidates.map(candidate => [
        candidate.name,
        candidate.party,
        getCandidateVoteCount(candidate.id),
        `${((getCandidateVoteCount(candidate.id) / votes.length) * 100).toFixed(1)}%`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] },
    });
    
    // Save PDF
    doc.save(`election-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const calculateAgeStats = () => {
    if (ageDistribution && ageDistribution.averageAge !== undefined) {
      return {
        avg: typeof ageDistribution.averageAge === 'number' 
          ? ageDistribution.averageAge.toFixed(1) 
          : '0.0',
        min: ageDistribution.minAge || 0,
        max: ageDistribution.maxAge || 0,
        ageGroups: ageDistribution.ageGroups || {}
      };
    }
    
    // Fallback calculation
    const ages = votes.map(v => v.age).filter(age => !isNaN(age));
    const avg = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
    const min = ages.length > 0 ? Math.min(...ages) : 0;
    const max = ages.length > 0 ? Math.max(...ages) : 0;
    
    const ageGroups = {
      '18-25': votes.filter(v => v.age >= 18 && v.age <= 25).length,
      '26-35': votes.filter(v => v.age >= 26 && v.age <= 35).length,
      '36-45': votes.filter(v => v.age >= 36 && v.age <= 45).length,
      '46-55': votes.filter(v => v.age >= 46 && v.age <= 55).length,
      '56+': votes.filter(v => v.age >= 56).length
    };
    
    return { 
      avg: avg.toFixed(1), 
      min, 
      max, 
      ageGroups 
    };
  };

  const ageStats = calculateAgeStats();

  const refreshData = () => {
    fetchAllData();
  };

  // Calculate voting timeline data
  const getHourlyVotes = () => {
    const hourlyData = Array(24).fill(0);
    
    votes.forEach(vote => {
      const hour = new Date(vote.votedAt).getHours();
      hourlyData[hour]++;
    });
    
    return hourlyData;
  };

  const hourlyVotes = getHourlyVotes();
  const maxHourlyVotes = Math.max(...hourlyVotes);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div className="loading-title">Loading Admin Dashboard</div>
          <div className="loading-subtitle">Fetching real-time vote data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="header-left">
            <div>
              <h1>👑 Election Admin</h1>
              <p className="admin-subtitle">{votes.length} votes • {candidates.length} candidates</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-icon" onClick={refreshData} title="Refresh">
              <span className="icon">🔄</span>
              {!isMobile && <span>Refresh</span>}
            </button>
            <button className="btn-icon btn-export" onClick={exportToCSV} title="Export CSV">
              <span className="icon">📊</span>
              {!isMobile && <span>CSV</span>}
            </button>
            <button className="btn-icon btn-pdf" onClick={exportToPDF} title="Export PDF">
              <span className="icon">📄</span>
              {!isMobile && <span>PDF</span>}
            </button>
            <button className="btn-icon btn-logout" onClick={onLogout} title="Logout">
              <span className="icon">⎋</span>
              {!isMobile && <span>Logout</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Stats Bar */}
      {isMobile && (
        <div className="mobile-stats-bar">
          <div className="mobile-stat">
            <span className="stat-number">{votes.length}</span>
            <span className="stat-label">Votes</span>
          </div>
          <div className="mobile-stat">
            <span className="stat-number">{candidates.length}</span>
            <span className="stat-label">Candidates</span>
          </div>
          <div className="mobile-stat">
            <span className="stat-number">{ageStats.avg}</span>
            <span className="stat-label">Avg Age</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'votes' ? 'active' : ''}`}
          onClick={() => setActiveTab('votes')}
        >
          <span className="tab-icon">🗳️</span>
          {!isMobile && <span>Votes</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <span className="tab-icon">📈</span>
          {!isMobile && <span>Analytics</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'candidates' ? 'active' : ''}`}
          onClick={() => setActiveTab('candidates')}
        >
          <span className="tab-icon">👥</span>
          {!isMobile && <span>Candidates</span>}
        </button>
      </div>

      {/* Desktop Stats Overview */}
      {!isMobile && (
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">🗳️</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalVotes || votes.length}</div>
              <div className="stat-label">Total Votes</div>
              <div className="stat-change">Live data</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{candidates.length}</div>
              <div className="stat-label">Candidates</div>
              <div className="stat-change">10 active</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{ageStats.avg}</div>
              <div className="stat-label">Average Age</div>
              <div className="stat-change">{ageStats.min}-{ageStats.max} range</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-value">
                {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
              </div>
              <div className="stat-label">Last Updated</div>
              <div className="stat-change">Just now</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="admin-main">
        {activeTab === 'votes' && (
          <div className="tab-content votes-tab">
            <div className="filters-section">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search voters, candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button className="clear-search" onClick={() => setSearchTerm('')}>
                    ✕
                  </button>
                )}
              </div>
              <select 
                value={selectedCandidate} 
                onChange={(e) => setSelectedCandidate(e.target.value)}
                className="candidate-filter"
              >
                <option value="all">All Candidates</option>
                {candidates.map(candidate => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="votes-list">
              <div className="list-header">
                <h3>Vote Records ({filteredVotes.length})</h3>
                <div className="list-actions">
                  <button className="btn-small">Sort by Date</button>
                </div>
              </div>
              
              {filteredVotes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <h4>No votes found</h4>
                  <p>Try changing your search or filter criteria</p>
                </div>
              ) : (
                <div className="votes-container">
                  {filteredVotes.slice(0, 100).map((vote, index) => (
                    <div key={vote._id || index} className="vote-card">
                      <div className="vote-header">
                        <div className="voter-info">
                          <div className="voter-avatar">
                            {vote.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="voter-name">{vote.name}</div>
                            <div className="voter-meta">
                              <span className="voter-age">{vote.age} years</span>
                              <span className="vote-time">{formatDate(vote.votedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="vote-badge">
                          Vote #{index + 1}
                        </div>
                      </div>
                      <div className="vote-details">
                        <div className="vote-candidate">
                          <div className="candidate-color" style={{ backgroundColor: getCandidateColor(vote.candidateId) }} />
                          <div>
                            <div className="candidate-name">{vote.candidateName}</div>
                            <div className="candidate-party">{vote.candidateParty}</div>
                          </div>
                        </div>
                        <div className="vote-meta">
                          <div className="meta-item">
                            <span className="meta-label">IP:</span>
                            <span className="meta-value">{vote.ipAddress}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="tab-content analytics-tab">
            <div className="analytics-grid">
              {/* Age Distribution */}
              <div className="analytics-card">
                <div className="card-header">
                  <h4>📊 Age Distribution</h4>
                  <p>Voter demographics by age group</p>
                </div>
                <div className="age-bars">
                  {Object.entries(ageStats.ageGroups).map(([group, count]) => (
                    <div key={group} className="age-bar">
                      <div className="age-label">{group}</div>
                      <div className="age-bar-container">
                        <div 
                          className="age-bar-fill"
                          style={{
                            width: `${votes.length > 0 ? (count / votes.length) * 100 : 0}%`,
                            background: 'linear-gradient(90deg, #4f46e5, #7c3aed)'
                          }}
                        />
                      </div>
                      <div className="age-stats">
                        <span className="age-count">{count}</span>
                        <span className="age-percent">
                          {votes.length > 0 ? ((count / votes.length) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="age-summary">
                  <div className="summary-item">
                    <span className="summary-label">Youngest:</span>
                    <span className="summary-value">{ageStats.min} years</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Oldest:</span>
                    <span className="summary-value">{ageStats.max} years</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Average:</span>
                    <span className="summary-value">{ageStats.avg} years</span>
                  </div>
                </div>
              </div>

              {/* Voting Timeline */}
              <div className="analytics-card">
                <div className="card-header">
                  <h4>📅 Voting Timeline</h4>
                  <p>Votes per hour (last 24 hours)</p>
                </div>
                <div className="timeline-chart">
                  {hourlyVotes.map((count, hour) => {
                    const height = maxHourlyVotes > 0 ? (count / maxHourlyVotes) * 100 : 0;
                    
                    return (
                      <div key={hour} className="timeline-bar">
                        <div 
                          className="bar-fill"
                          style={{
                            height: `${height}%`,
                            background: count > 0 ? 'linear-gradient(to top, #10b981, #059669)' : '#e5e7eb'
                          }}
                        />
                        <div className="bar-label">{hour.toString().padStart(2, '0')}</div>
                        <div className="bar-count">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Candidates */}
              <div className="analytics-card">
                <div className="card-header">
                  <h4>🏆 Top Candidates</h4>
                  <p>Leading candidates by votes</p>
                </div>
                <div className="top-candidates">
                  {candidates
                    .sort((a, b) => getCandidateVoteCount(b.id) - getCandidateVoteCount(a.id))
                    .slice(0, 5)
                    .map((candidate, index) => {
                      const votesCount = getCandidateVoteCount(candidate.id);
                      const percentage = votes.length > 0 ? (votesCount / votes.length) * 100 : 0;
                      
                      return (
                        <div key={candidate.id} className="top-candidate">
                          <div className="candidate-rank">{index + 1}</div>
                          <div className="candidate-info">
                            <div className="candidate-name">{candidate.name}</div>
                            <div className="candidate-party">{candidate.party}</div>
                          </div>
                          <div className="candidate-stats">
                            <div className="vote-count">{votesCount} votes</div>
                            <div className="vote-percent">{percentage.toFixed(1)}%</div>
                          </div>
                          <div className="vote-progress">
                            <div 
                              className="progress-fill"
                              style={{
                                width: `${Math.min(percentage, 100)}%`,
                                backgroundColor: candidate.color
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'candidates' && (
          <div className="tab-content candidates-tab">
            <div className="candidates-grid">
              {candidates
                .sort((a, b) => getCandidateVoteCount(b.id) - getCandidateVoteCount(a.id))
                .map((candidate, index) => {
                  const votesCount = getCandidateVoteCount(candidate.id);
                  const percentage = votes.length > 0 ? (votesCount / votes.length) * 100 : 0;
                  
                  return (
                    <div key={candidate.id} className="candidate-card">
                      <div className="candidate-rank">
                        <div className="rank-badge">#{index + 1}</div>
                        <div 
                          className="candidate-color" 
                          style={{ backgroundColor: candidate.color }}
                        />
                      </div>
                      <div className="candidate-info">
                        <h4 className="candidate-name">{candidate.name}</h4>
                        <div className="candidate-party">{candidate.party}</div>
                      </div>
                      <div className="candidate-stats">
                        <div className="stat">
                          <div className="stat-value">{votesCount}</div>
                          <div className="stat-label">Votes</div>
                        </div>
                        <div className="stat">
                          <div className="stat-value">{percentage.toFixed(1)}%</div>
                          <div className="stat-label">Share</div>
                        </div>
                      </div>
                      <div className="vote-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${Math.min(percentage, 100)}%`,
                              backgroundColor: candidate.color
                            }}
                          />
                        </div>
                        <div className="progress-label">
                          {votesCount} votes • {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="admin-footer">
        <div className="footer-content">
          <div className="footer-info">
            <div className="footer-logo">👑</div>
            <div>
              <div className="footer-title">Nepal Election Commission 2026</div>
              <div className="footer-subtitle">Real-time Admin Dashboard</div>
            </div>
          </div>
          <div className="footer-status">
            <div className={`status-indicator ${loading ? 'loading' : 'live'}`} />
            <span className="status-text">
              {loading ? 'Updating...' : 'Live Data'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;