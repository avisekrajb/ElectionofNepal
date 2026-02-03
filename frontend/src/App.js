import React, { useState, useCallback, useRef, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import { CANDIDATES, TOAST_STYLE } from './utils/constants';
import { castVote, getVoteStats, getRecentVotes } from './api/voteApi';
import { 
  submitFeedback as apiSubmitFeedback, 
  getAllFeedbacks as apiGetAllFeedbacks,
  getFeedbackCount as apiGetFeedbackCount 
} from './api/feedbackApi';
import './styles/globals.css';

// Language translations
const TRANSLATIONS = {
  en: {
    // Header
    election: "Nepal Election",
    year: "2026",
    voteDay: "Vote Day: March 5, 2026",
    days: "Days",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",
    searchPlaceholder: "Search candidates or parties…",
    
    // User states
    registerToVote: "Register to Vote →",
    welcome: "Welcome",
    voteLocked: "Vote Locked",
    logout: "Logout",
    youHaveVotedFor: "You have voted for",
    
    // Candidate section
    voteForCandidate: "🗳️ Vote for Candidate",
    voteCount: "Vote Count",
    noCandidatesFound: "No candidates found",
    
    // Live activity
    liveActivity: "Live Activity",
    votes: "votes",
    noVotesYet: "No votes yet.",
    beFirstToVote: "Be the first to vote!",
    seeAllVotes: "See All Votes",
    
    // Footer
    copyright: "© 2026 Nepal Election Commission",
    developedBy: "Developed by Abhishek Rajbanshi❤️for democratic Nepal 🇳🇵.",
    
    // Modals
    registerModalTitle: "Register to Vote",
    registerModalDesc: "Enter your details below. You must be 18 or older.",
    nameLabel: "Name",
    namePlaceholder: "Your full name",
    ageLabel: "Age",
    agePlaceholder: "18-100",
    ageWarning: "Age must be between 18-100 years to vote.",
    registerNow: "Register Now",
    
    logoutModalTitle: "Logout Confirmation",
    logoutModalDesc: "Are you sure you want to logout? This will clear your registration and vote.",
    logoutWarning: "Warning: If you voted, you won't be able to vote again with the same name and age.",
    cancel: "Cancel",
    confirmLogout: "Logout",
    
    exitModalTitle: "Exit Confirmation",
    exitModalDesc: "Are you sure you want to exit? You will be logged out and all data will be cleared.",
    confirmExit: "Exit",
    stay: "Stay",
    
    // Vote count modal
    voteCountTitle: "📊 Vote Count",
    totalVotes: "Total votes:",
    
    // See All Votes Modal
    seeAllVotesTitle: "📋 All Votes",
    voterName: "Voter Name",
    candidateVoted: "Candidate Voted",
    party: "Party",
    time: "Time",
    back: "Back",
    
    // Toasts
    pleaseEnterName: "Please enter your name",
    pleaseEnterValidAge: "Please enter a valid age",
    mustBe18: "You must be 18+ to vote",
    ageCannotExceed: "Age cannot be greater than 100",
    welcomeAdmin: "Welcome, Admin! Redirecting to dashboard...",
    welcomeUser: "Welcome, %s! You can now vote",
    pleaseRegisterFirst: "Please register first to vote!",
    alreadyVoted: "You already voted! Only 1 vote allowed.",
    votedFor: "Voted for %s! 🎯",
    failedToVote: "Failed to cast vote. Please try again.",
    loggedOut: "Logged out successfully",
    adminLoggedOut: "Admin logged out successfully",
    
    // Follow text
    follow: "Follow:",
    live: "Live",
    
    // Feedback
    viewMore: "View More",
    viewLess: "View Less"
  },
  ne: {
    // Header
    election: "नेपाल निर्वाचन",
    year: "२०८२",
    voteDay: "मतदान दिवस:  21 Falgun 2082 / 7:00 AM–5:00 PM",
    days: "दिन",
    hours: "घण्टा",
    minutes: "मिनेट",
    seconds: "सेकेन्ड",
    searchPlaceholder: "उम्मेदवार वा दल खोज्नुहोस्…",
    
    // User states
    registerToVote: "मतदानको लागि दर्ता गर्नुहोस् →",
    welcome: "स्वागत छ",
    voteLocked: "मत लक भयो",
    logout: "लग आउट",
    youHaveVotedFor: "तपाईंले मत दिनुभएको छ",
    
    // Candidate section
    voteForCandidate: "🗳️ उम्मेदवारलाई मत दिनुहोस्",
    voteCount: "मत गणना",
    noCandidatesFound: "कुनै उम्मेदवार भेटिएन",
    
    // Live activity
    liveActivity: "प्प्रत्यक्ष",
    votes: "मतहरू",
    noVotesYet: "अहिलेसम्म कुनै मत छैन।",
    beFirstToVote: "पहिलो मत दिनुहोस्!",
    seeAllVotes: "सबै मत हेर्नुहोस्",
    
    // Footer
    copyright: "© २०२६ नेपाल निर्वाचन आयोग",
    developedBy: "अभिषेक राजबंशी❤️द्वारा लोकतान्त्रिक नेपालको लागि विकास गरिएको 🇳🇵।",
    
    // Modals
    registerModalTitle: "मतदानको लागि दर्ता गर्नुहोस्",
    registerModalDesc: "तल आफ्नो विवरण हाल्नुहोस्। तपाईं १८ वर्ष वा सोभन्दा माथि हुनुपर्छ।",
    nameLabel: "नाम",
    namePlaceholder: "तपाईंको पुरा नाम",
    ageLabel: "उमेर",
    agePlaceholder: "१८-१००",
    ageWarning: "मतदान गर्न उमेर १८-१०० बीच हुनुपर्छ।",
    registerNow: "अहिले दर्ता गर्नुहोस्",
    
    logoutModalTitle: "लग आउट पुष्टिकरण",
    logoutModalDesc: "तपाईं निश्चित रूपमा लग आउट गर्न चाहनुहुन्छ? यसले तपाईंको दर्ता र मत हटाउनेछ।",
    logoutWarning: "चेतावनी: यदि तपाईंले मत दिनुभएको छ भने, उही नाम र उमेरले फेरि मत दिन सक्नुहुने छैन।",
    cancel: "रद्द गर्नुहोस्",
    confirmLogout: "लग आउट",
    
    exitModalTitle: "बाहिर निस्कन पुष्टिकरण",
    exitModalDesc: "तपाईं निश्चित रूपमा बाहिर निस्कन चाहनुहुन्छ? तपाईं लग आउट हुनुहुनेछ र सबै डाटा हटाइनेछ।",
    confirmExit: "बाहिर निस्कनुहोस्",
    stay: "रहनुहोस्",
    
    // Vote count modal
    voteCountTitle: "📊 मत गणना",
    totalVotes: "कुल मतहरू:",
    
    // See All Votes Modal
    seeAllVotesTitle: "📋 सबै मतहरू",
    voterName: "मतदाता नाम",
    candidateVoted: "मत दिईएको उम्मेदवार",
    party: "दल",
    time: "समय",
    back: "पछाडि",
    
    // Toasts
    pleaseEnterName: "कृपया आफ्नो नाम हाल्नुहोस्",
    pleaseEnterValidAge: "कृपया वैध उमेर हाल्नुहोस्",
    mustBe18: "मतदान गर्न १८+ हुनुपर्छ",
    ageCannotExceed: "उमेर १०० भन्दा बढी हुन सक्दैन",
    welcomeAdmin: "स्वागत छ, प्रशासक! ड्याशबोर्डमा पुनर्निर्देशन गर्दै...",
    welcomeUser: "स्वागत छ, %s! तपाईं अब मत दिन सक्नुहुन्छ",
    pleaseRegisterFirst: "कृपया पहिले दर्ता गर्नुहोस्!",
    alreadyVoted: "तपाईंले पहिले नै मत दिनुभएको छ! केवल १ मत मात्र अनुमति छ।",
    votedFor: "%s लाई मत दिइयो! 🎯",
    failedToVote: "मत दिन असफल भयो। कृपया पुनः प्रयास गर्नुहोस्।",
    loggedOut: "सफलतापूर्वक लग आउट गरियो",
    adminLoggedOut: "प्रशासक सफलतापूर्वक लग आउट गरियो",
    
    // Follow text
    follow: "पछ्याउनुहोस्:",
    live: "सजीव",
    
    // Feedback
    viewMore: "थप हेर्नुहोस्",
    viewLess: "कम हेर्नुहोस्"
  }
};

export default function App() {
  // Language state
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('election_language');
    return saved || 'en';
  });
  
  // Load user data from localStorage on initial render
  const [registered, setRegistered] = useState(() => {
    const saved = localStorage.getItem('election_user');
    return saved ? JSON.parse(saved).registered : false;
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('election_user');
    return saved ? JSON.parse(saved).user : { name: "", age: "" };
  });

  const [candVoted, setCandVoted] = useState(() => {
    const saved = localStorage.getItem('election_vote');
    return saved ? JSON.parse(saved).candVoted : null;
  });

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);

  const [showSheet, setShowSheet] = useState(false);
  const [sheetPage, setSheetPage] = useState("register");

  const [candVotes, setCandVotes] = useState(
    () => Object.fromEntries(CANDIDATES.map(c => [c.id, 0]))
  );

  const [search, setSearch] = useState("");
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showAllVotesModal, setShowAllVotesModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voteStats, setVoteStats] = useState({
    totalVotes: 0,
    votesByCandidate: []
  });

  // Feedback system states
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [showAllFeedbacks, setShowAllFeedbacks] = useState(false);
  const [allVotesData, setAllVotesData] = useState([]);

  /* countdown timer */
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const voteDay = new Date("2026-03-05T00:00:00");
      const now = new Date();
      const diff = voteDay - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  /* toasts */
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const toast = useCallback((msg, type = "info") => {
    const id = toastId.current++;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 2800);
  }, []);

  /* marquee — fetch from backend */
  const [marqueeItems, setMarqueeItems] = useState([]);
  
  // Handle back button/exit
  useEffect(() => {
    const handleBackButton = (e) => {
      if (registered) {
        e.preventDefault();
        setShowExitModal(true);
      }
    };

    window.addEventListener('popstate', handleBackButton);
    
    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [registered]);

  // Fetch vote statistics and feedbacks on load
  useEffect(() => {
    // Initial fetch
    fetchVoteStats();
    fetchRecentVotes();
    fetchFeedbacks();
    fetchFeedbackCount();
    
    // Refresh stats less frequently - every 60 seconds instead of 30
    const interval = setInterval(() => {
      fetchVoteStats();
      fetchRecentVotes();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Save user data to localStorage whenever it changes
  useEffect(() => {
    if (user.name || registered) {
      localStorage.setItem('election_user', JSON.stringify({
        registered,
        user,
        isAdmin
      }));
    }
  }, [registered, user, isAdmin]);

  // Save vote data to localStorage
  useEffect(() => {
    if (candVoted) {
      localStorage.setItem('election_vote', JSON.stringify({
        candVoted,
        votedAt: new Date().toISOString()
      }));
    }
  }, [candVoted]);

  // Save language preference
  useEffect(() => {
    localStorage.setItem('election_language', language);
  }, [language]);

  // Load admin status from localStorage on initial render
  useEffect(() => {
    const saved = localStorage.getItem('election_user');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.isAdmin) {
        setIsAdmin(true);
      }
    }
  }, []);

  const fetchVoteStats = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const response = await getVoteStats();
      if (response.success) {
        setVoteStats({
          totalVotes: response.data.totalVotes,
          votesByCandidate: response.data.votesByCandidate
        });
        
        const updatedVotes = { ...candVotes };
        response.data.votesByCandidate.forEach(item => {
          if (updatedVotes[item._id]) {
            updatedVotes[item._id] = item.votes;
          }
        });
        setCandVotes(updatedVotes);
      }
    } catch (error) {
      console.error('Failed to fetch vote stats:', error);
    }
  };

  const fetchRecentVotes = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const response = await getRecentVotes();
      if (response.success) {
        const marqueeData = response.data.map(vote => {
          const candidate = CANDIDATES.find(c => 
            c.party === vote.candidateParty || 
            c.name === vote.candidateName
          );
          return {
            name: vote.name,
            party: vote.candidateParty,
            icon: candidate?.icon || "🗳️",
            candidateName: vote.candidateName,
            time: vote.createdAt
          };
        });
        setMarqueeItems(marqueeData);
        setAllVotesData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch recent votes:', error);
    }
  };

  const fetchAllVotes = async () => {
    try {
      const response = await getRecentVotes(100); // Fetch all votes
      if (response.success) {
        setAllVotesData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch all votes:', error);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await apiGetAllFeedbacks();
      if (response.success) {
        setFeedbacks(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
    }
  };

  const fetchFeedbackCount = async () => {
    try {
      const response = await apiGetFeedbackCount();
      if (response.success) {
        setFeedbackCount(response.count);
      }
    } catch (error) {
      console.error('Failed to fetch feedback count:', error);
    }
  };

  const addMarquee = useCallback((name, party, icon) => {
    setMarqueeItems(prev => [{ name, party, icon, time: new Date().toISOString() }, ...prev]);
  }, []);

  /* ── FEEDBACK SUBMISSION ── */
  const handleSubmitFeedback = async () => {
    if (!registered) {
      toast("Please register first to submit feedback!", "warn");
      setSheetPage("register");
      setShowSheet(true);
      return;
    }

    if (!feedbackMessage.trim()) {
      toast("Please enter your feedback message", "warn");
      return;
    }

    if (feedbackMessage.trim().length < 5) {
      toast("Feedback must be at least 5 characters", "warn");
      return;
    }

    setFeedbackLoading(true);
    try {
      const feedbackData = {
        name: user.name.trim(),
        age: parseInt(user.age, 10),
        message: feedbackMessage.trim()
      };

      const response = await apiSubmitFeedback(feedbackData);
      
      if (response.success) {
        toast(response.message, "success");
        setFeedbackMessage("");
        setShowFeedback(false);
        
        fetchFeedbacks();
        fetchFeedbackCount();
        
        setTimeout(() => {
          toast("Thank you for joining us! Our developer will reply soon. 💌", "info");
        }, 1000);
      } else {
        toast(response.message || "Failed to submit feedback", "error");
      }
    } catch (error) {
      if (error.message && error.message.includes('Endpoint not found')) {
        toast("Feedback feature is temporarily unavailable. Please try again later.", "error");
      } else if (error.message && error.message.includes('No response from server')) {
        toast("Cannot connect to server. Please check your internet connection.", "error");
      } else {
        toast(error.message || "Failed to submit feedback", "error");
      }
    } finally {
      setFeedbackLoading(false);
    }
  };

  /* ── REGISTER ── */
  const handleRegister = () => {
    const n = user.name.trim();
    const a = parseInt(user.age, 10);
    
    if (!n) { 
      toast(TRANSLATIONS[language].pleaseEnterName, "warn"); 
      return; 
    }
    if (!user.age || isNaN(a)) { 
      toast(TRANSLATIONS[language].pleaseEnterValidAge, "warn"); 
      return; 
    }
    if (a < 18) { 
      toast(TRANSLATIONS[language].mustBe18, "error"); 
      return; 
    }
    if (a > 100) { 
      toast(TRANSLATIONS[language].ageCannotExceed, "error"); 
      return; 
    }
    
    // Check if user is admin
    if (n.toLowerCase() === 'admin' && a === 23) {
      setRegistered(true);
      setIsAdmin(true);
      setShowSheet(false);
      toast(TRANSLATIONS[language].welcomeAdmin, "success");
      return;
    }
    
    setRegistered(true);
    setIsAdmin(false);
    setShowSheet(false);
    toast(TRANSLATIONS[language].welcomeUser.replace('%s', n), "success");
  };

  /* ── LOGOUT ── */
  const handleLogout = () => {
    localStorage.removeItem('election_user');
    localStorage.removeItem('election_vote');
    
    setRegistered(false);
    setIsAdmin(false);
    setUser({ name: "", age: "" });
    setCandVoted(null);
    setCandVotes(Object.fromEntries(CANDIDATES.map(c => [c.id, 0])));
    setShowLogoutModal(false);
    
    toast(TRANSLATIONS[language].loggedOut, "success");
  };

  /* ── ADMIN LOGOUT ── */
  const handleAdminLogout = () => {
    localStorage.removeItem('election_user');
    localStorage.removeItem('election_vote');
    
    setRegistered(false);
    setIsAdmin(false);
    setUser({ name: "", age: "" });
    setCandVoted(null);
    setCandVotes(Object.fromEntries(CANDIDATES.map(c => [c.id, 0])));
    
    toast(TRANSLATIONS[language].adminLoggedOut, "success");
  };

  /* ── EXIT CONFIRMATION ── */
  const handleExit = () => {
    handleLogout();
    setShowExitModal(false);
    window.history.back();
  };

  /* ── CANDIDATE VOTE (with API call) ── */
  const handleCandVote = useCallback(async (id) => {
    if (!registered) { 
      setSheetPage("register");
      setShowSheet(true);
      toast(TRANSLATIONS[language].pleaseRegisterFirst, "warn"); 
      return; 
    }
    if (candVoted) { 
      toast(TRANSLATIONS[language].alreadyVoted, "error"); 
      return; 
    }

    setIsLoading(true);
    try {
      const voteData = {
        name: user.name.trim(),
        age: parseInt(user.age, 10),
        candidateId: id
      };

      const response = await castVote(voteData);
      
      if (response.success) {
        setCandVoted(id);
        setCandVotes(prev => ({ ...prev, [id]: prev[id] + 1 }));
        
        const cand = CANDIDATES.find(c => c.id === id);
        toast(TRANSLATIONS[language].votedFor.replace('%s', cand?.name), "success");
        addMarquee(user.name, cand?.party, cand?.icon);
        
        fetchVoteStats();
        fetchRecentVotes();
      }
    } catch (error) {
      if (error.contactAdmin) {
        toast(error.message, "error");
      } else {
        toast(TRANSLATIONS[language].failedToVote, "error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [registered, candVoted, user.name, user.age, toast, addMarquee, language]);

  /* ── derived ── */
  const filtered = CANDIDATES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.party.toLowerCase().includes(search.toLowerCase())
  );

  const votedCandidate = candVoted ? CANDIDATES.find(c => c.id === candVoted) : null;

  const getCandidateWithVotes = (candidate) => {
    const backendVote = voteStats.votesByCandidate.find(v => v._id === candidate.id);
    return {
      ...candidate,
      votes: backendVote ? backendVote.votes : candVotes[candidate.id],
      candidateName: backendVote ? backendVote.candidateName : candidate.name,
      candidateParty: backendVote ? backendVote.candidateParty : candidate.party
    };
  };

  const sortedCandidates = CANDIDATES
    .map(getCandidateWithVotes)
    .sort((a, b) => b.votes - a.votes);

  // Get translation function
  const t = (key) => TRANSLATIONS[language][key] || key;

  // Filter feedbacks for display
  const displayedFeedbacks = showAllFeedbacks ? feedbacks : feedbacks.slice(0, 10);

  // Render Admin Dashboard if user is admin
  if (isAdmin) {
    return <AdminDashboard onLogout={handleAdminLogout} language={language} setLanguage={setLanguage} />;
  }

  return (
    <div style={{
      width: "100%",
      maxWidth: 375,
      margin: "0 auto",
      minHeight: "100vh",
      background: "linear-gradient(175deg, #fce7f3 0%, #dbeafe 25%, #d1fae5 50%, #e0e7ff 75%, #fce7f3 100%)",
      color: "#1e293b",
      fontFamily: "'SF Pro Display','Helvetica Neue',system-ui,sans-serif",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      WebkitTapHighlightColor: "transparent",
    }}>

      {/* ── ambient glows ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ 
          position: "absolute", 
          top: -60, 
          left: -40, 
          width: 260, 
          height: 260, 
          borderRadius: "50%", 
          background: "radial-gradient(circle,rgba(236,72,153,0.15),transparent 70%)", 
          filter: "blur(50px)" 
        }}/>
        <div style={{ 
          position: "absolute", 
          top: "35%", 
          right: -70, 
          width: 230, 
          height: 230, 
          borderRadius: "50%", 
          background: "radial-gradient(circle,rgba(14,165,233,0.15),transparent 70%)", 
          filter: "blur(45px)" 
        }}/>
        <div style={{ 
          position: "absolute", 
          bottom: 50, 
          left: "20%", 
          width: 190, 
          height: 190, 
          borderRadius: "50%", 
          background: "radial-gradient(circle,rgba(16,185,129,0.15),transparent 70%)", 
          filter: "blur(40px)" 
        }}/>
      </div>

      {/* ── TOASTS ── */}
      <div style={{ 
        position: "fixed", 
        top: 14, 
        left: "50%", 
        transform: "translateX(-50%)", 
        zIndex: 999, 
        width: "92%", 
        maxWidth: 345, 
        display: "flex", 
        flexDirection: "column", 
        gap: 6, 
        pointerEvents: "none" 
      }}>
        {toasts.map(t => {
          const s = TOAST_STYLE[t.type];
          return (
            <div key={t.id} style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 10, 
              background: `${s.bg}`, 
              backdropFilter: "blur(12px)", 
              borderRadius: 12, 
              padding: "10px 13px", 
              boxShadow: "0 6px 30px rgba(0,0,0,0.15)", 
              animation: "toastSlide .3s cubic-bezier(.4,0,.2,1)", 
              pointerEvents: "auto" 
            }}>
              <div style={{ 
                width: 21, 
                height: 21, 
                borderRadius: "50%", 
                background: "rgba(255,255,255,0.25)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: 11, 
                fontWeight: 700, 
                flexShrink: 0, 
                color: "#fff" 
              }}>
                {s.icon}
              </div>
              <span style={{ 
                fontSize: 12, 
                color: "#fff", 
                fontWeight: 500, 
                lineHeight: 1.35 
              }}>
                {t.msg}
              </span>
            </div>
          );
        })}
      </div>

      {/* ─── MAIN BODY ─── */}
      <div style={{ 
        position: "relative", 
        zIndex: 1, 
        flex: 1, 
        display: "flex", 
        flexDirection: "column", 
        padding: "18px 14px 0", 
        overflowY: "auto",
        WebkitOverflowScrolling: "touch" 
      }}>

        {/* ── TOP BAR: Language + Social Media + Live ── */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          marginBottom: 12 
        }}>
          {/* Language Selector + Social Media */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Language Dropdown */}
            <div style={{ position: "relative" }}>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  borderRadius: 10,
                  padding: "4px 28px 4px 10px",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#7c3aed",
                  cursor: "pointer",
                  appearance: "none",
                  outline: "none",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                  width: 100
                }}
              >
                <option value="en">🇺🇸 English</option>
                <option value="ne">🇳🇵 नेपाली</option>
              </select>
              <div style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                fontSize: 10,
                color: "#7c3aed"
              }}>
                ▼
              </div>
            </div>

            {/* Follow Us */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ 
                fontSize: 8.5, 
                color: "#64748b", 
                textTransform: "uppercase", 
                letterSpacing: 0.8, 
                fontWeight: 600, 
                marginRight: 3 
              }}>
                {t('follow')}
              </span>
              <a 
                href="https://www.facebook.com/abhishek.razwanc" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  width: 22, 
                  height: 22, 
                  borderRadius: "50%", 
                  background: "rgba(59,130,246,0.15)", 
                  border: "1px solid rgba(59,130,246,0.3)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  textDecoration: "none", 
                  transition: "all .2s" 
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#3B82F6">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://www.tiktok.com/@engineerbeta?is_from_webapp=1&sender_device=pc" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  width: 22, 
                  height: 22, 
                  borderRadius: "50%", 
                  background: "rgba(0,0,0,0.1)", 
                  border: "1px solid rgba(0,0,0,0.15)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  textDecoration: "none", 
                  transition: "all .2s" 
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#000">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a 
                href="https://wa.me/9779824380896" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  width: 22, 
                  height: 22, 
                  borderRadius: "50%", 
                  background: "rgba(34,197,94,0.15)", 
                  border: "1px solid rgba(34,197,94,0.3)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  textDecoration: "none", 
                  transition: "all .2s" 
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#22C55E">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Live indicator */}
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 4, 
            background: "rgba(255,255,255,0.6)", 
            borderRadius: 12, 
            padding: "3px 9px", 
            border: "1px solid rgba(16,185,129,0.3)", 
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)" 
          }}>
            <div style={{ 
              width: 5, 
              height: 5, 
              borderRadius: "50%", 
              background: "#10b981", 
              boxShadow: "0 0 8px #10b981", 
              animation: "livePulse 1.8s ease-in-out infinite" 
            }}/>
            <span style={{ 
              fontSize: 8.5, 
              color: "#059669", 
              letterSpacing: 1.2, 
              textTransform: "uppercase", 
              fontWeight: 700 
            }}>
              {t('live')}
            </span>
          </div>
        </div>

        {/* header */}
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: 22, 
            fontWeight: 800, 
            letterSpacing: -0.5, 
            color: "#1e293b", 
            lineHeight: 1.28, 
            textShadow: "0 2px 4px rgba(0,0,0,0.05)" 
          }}>
            {t('election')}<br/>
            <span style={{ 
              background: "linear-gradient(110deg,#ec4899,#0ea5e9 50%,#10b981)", 
              WebkitBackgroundClip: "text", 
              WebkitTextFillColor: "transparent" 
            }}>
              {t('year')}
            </span>
          </h1>
        </div>

        {/* ── COUNTDOWN TIMER ── */}
        <div style={{ 
          background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(14,165,233,0.15))", 
          border: "1px solid rgba(236,72,153,0.3)", 
          borderRadius: 16, 
          padding: "12px 14px", 
          marginBottom: 12, 
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)" 
        }}>
          <div style={{ 
            textAlign: "center", 
            fontSize: 9, 
            color: "#64748b", 
            textTransform: "uppercase", 
            letterSpacing: 1.2, 
            fontWeight: 700, 
            marginBottom: 8 
          }}>
            {t('voteDay')}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            {[
              { label: t('days'), value: timeLeft.days },
              { label: t('hours'), value: timeLeft.hours },
              { label: t('minutes'), value: timeLeft.minutes },
              { label: t('seconds'), value: timeLeft.seconds },
            ].map((item, idx) => (
              <div key={idx} style={{ 
                flex: 1, 
                background: "rgba(255,255,255,0.7)", 
                borderRadius: 12, 
                padding: "8px 4px", 
                border: "1px solid rgba(236,72,153,0.2)", 
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)" 
              }}>
                <div style={{ 
                  fontSize: 18, 
                  fontWeight: 800, 
                  background: "linear-gradient(135deg,#ec4899,#0ea5e9)", 
                  WebkitBackgroundClip: "text", 
                  WebkitTextFillColor: "transparent", 
                  lineHeight: 1 
                }}>
                  {String(item.value).padStart(2, '0')}
                </div>
                <div style={{ 
                  fontSize: 7.5, 
                  color: "#64748b", 
                  textTransform: "uppercase", 
                  letterSpacing: 0.5, 
                  marginTop: 3, 
                  fontWeight: 600 
                }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SEARCH BAR ── */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <svg style={{ 
            position: "absolute", 
            left: 11, 
            top: "50%", 
            transform: "translateY(-50%)", 
            pointerEvents: "none" 
          }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')}
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ 
              width: "100%", 
              background: "rgba(255,255,255,0.7)", 
              border: "1px solid rgba(203,213,225,0.5)", 
              borderRadius: 12, 
              padding: "10px 34px 10px 34px", 
              color: "#1e293b", 
              fontSize: 12, 
              outline: "none", 
              boxSizing: "border-box", 
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              WebkitAppearance: "none"
            }}
          />
          {search && (
            <button 
              onClick={() => setSearch("")} 
              style={{ 
                position: "absolute", 
                right: 10, 
                top: "50%", 
                transform: "translateY(-50%)", 
                background: "none", 
                border: "none", 
                color: "#64748b", 
                fontSize: 16, 
                cursor: "pointer", 
                padding: 0, 
                lineHeight: 1, 
                fontWeight: 700 
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* ── "You have voted for" banner ── */}
        {registered && votedCandidate && (
          <div style={{
            background: `linear-gradient(135deg, ${votedCandidate.color}20, ${votedCandidate.color}10)`,
            border: `2px solid ${votedCandidate.color}40`,
            borderRadius: 16,
            padding: "12px 14px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "bannerPop .35s cubic-bezier(.4,0,.2,1)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: "50%", 
              background: `${votedCandidate.color}30`, 
              border: `2px solid ${votedCandidate.color}`, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontSize: 20, 
              flexShrink: 0, 
              boxShadow: `0 2px 10px ${votedCandidate.color}40` 
            }}>
              {votedCandidate.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: 10.5, 
                color: "#64748b", 
                fontWeight: 600, 
                marginBottom: 2 
              }}>
                {t('youHaveVotedFor')}
              </div>
              <div style={{ 
                fontSize: 14, 
                color: votedCandidate.color, 
                fontWeight: 800, 
                letterSpacing: -0.3 
              }}>
                {votedCandidate.name}
              </div>
              <div style={{ 
                fontSize: 9, 
                color: "#94a3b8", 
                marginTop: 1, 
                fontWeight: 500 
              }}>
                {votedCandidate.party}
              </div>
            </div>
            <div style={{ 
              background: `${votedCandidate.color}25`, 
              borderRadius: 10, 
              padding: "5px 10px", 
              display: "flex", 
              alignItems: "center", 
              gap: 4 
            }}>
              <span style={{ fontSize: 10 }}>🔒</span>
              <span style={{ 
                fontSize: 10, 
                color: votedCandidate.color, 
                fontWeight: 700 
              }}>
                {t('voteLocked')}
              </span>
            </div>
          </div>
        )}

        {/* user badge row */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          gap: 7, 
          marginBottom: 12, 
          flexWrap: "wrap" 
        }}>
          {registered ? (
            <>
              <div style={{ 
                background: "linear-gradient(135deg,rgba(236,72,153,0.2),rgba(236,72,153,0.15))", 
                borderRadius: 10, 
                padding: "5px 12px", 
                border: "1px solid rgba(236,72,153,0.4)", 
                display: "flex", 
                alignItems: "center", 
                gap: 5, 
                boxShadow: "0 2px 6px rgba(0,0,0,0.06)" 
              }}>
                <span style={{ fontSize: 11 }}>👤</span>
                <span style={{ 
                  fontSize: 11, 
                  color: "#be185d", 
                  fontWeight: 700 
                }}>
                  {user.name}
                </span>
              </div>
              {candVoted && (
                <div style={{ 
                  background: "linear-gradient(135deg,rgba(16,185,129,0.2),rgba(16,185,129,0.15))", 
                  borderRadius: 10, 
                  padding: "5px 12px", 
                  border: "1px solid rgba(16,185,129,0.4)", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 4, 
                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)" 
                }}>
                  <span style={{ fontSize: 10 }}>✓</span>
                  <span style={{ 
                    fontSize: 10, 
                    color: "#059669", 
                    fontWeight: 700 
                  }}>
                    {t('voteLocked')}
                  </span>
                </div>
              )}
              <button 
                onClick={() => setShowLogoutModal(true)}
                style={{ 
                  background: "linear-gradient(135deg,rgba(239,68,68,0.2),rgba(239,68,68,0.15))", 
                  border: "1px solid rgba(239,68,68,0.4)", 
                  borderRadius: 10, 
                  padding: "5px 12px", 
                  color: "#dc2626", 
                  fontSize: 10, 
                  fontWeight: 700, 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 4, 
                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)" 
                }}
              >
                <span style={{ fontSize: 10 }}>⎋</span>
                {t('logout')}
              </button>
            </>
          ) : (
            <button 
              onClick={() => { setSheetPage("register"); setShowSheet(true); }} 
              style={{ 
                background: "linear-gradient(135deg,#ec4899,#0ea5e9)", 
                border: "none", 
                borderRadius: 12, 
                padding: "8px 20px", 
                color: "#fff", 
                fontSize: 13, 
                fontWeight: 700, 
                cursor: "pointer", 
                boxShadow: "0 4px 14px rgba(236,72,153,0.4)", 
                transition: "all .2s" 
              }}
            >
              {t('registerToVote')}
            </button>
          )}
        </div>

        {/* ── CANDIDATES GRID (2 rows of 5) ── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            marginBottom: 10 
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ 
                fontSize: 13, 
                fontWeight: 800, 
                color: "#1e293b", 
                letterSpacing: -0.3 
              }}>
                {t('voteForCandidate')}
              </span>
            </div>
            <button 
              onClick={() => setShowTipsModal(true)} 
              style={{ 
                background: "linear-gradient(135deg,rgba(139,92,246,0.2),rgba(139,92,246,0.15))", 
                border: "1px solid rgba(139,92,246,0.4)", 
                borderRadius: 10, 
                padding: "5px 12px", 
                color: "#6d28d9", 
                fontSize: 10, 
                fontWeight: 700, 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center", 
                gap: 4, 
                boxShadow: "0 2px 6px rgba(0,0,0,0.06)" 
              }}
            >
              {t('voteCount')}
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>

          {/* First 5 candidates */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 7, marginBottom: 7 }}>
            {filtered.slice(0, 5).map(c => {
              const isV = candVoted === c.id;
              const locked = candVoted !== null && !isV;
              return (
                <div 
                  key={c.id} 
                  onClick={() => !locked && handleCandVote(c.id)}
                  style={{
                    position: "relative",
                    borderRadius: 14,
                    overflow: "hidden",
                    border: isV ? `2.5px solid ${c.color}` : "2.5px solid rgba(203,213,225,0.4)",
                    cursor: locked ? "not-allowed" : "pointer",
                    transition: "all .25s cubic-bezier(.4,0,.2,1)",
                    boxShadow: isV ? `0 6px 20px ${c.color}40` : "0 3px 10px rgba(0,0,0,0.08)",
                    opacity: locked ? 0.35 : 1,
                    WebkitTapHighlightColor: "transparent",
                    aspectRatio: "1",
                    transform: isV ? "scale(1.02)" : "scale(1)",
                    touchAction: "manipulation"
                  }}
                >
                  <img 
                    src={c.photo} 
                    alt={c.name} 
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      zIndex: 0,
                      filter: isV ? "brightness(0.9) saturate(1.3)" : "brightness(0.85) saturate(1)",
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    background: isV ? `linear-gradient(to top, ${c.color}70 0%, transparent 65%)` : "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)",
                  }}/>
                  {isV && (
                    <div style={{ 
                      position: "absolute", 
                      top: 4, 
                      right: 4, 
                      zIndex: 5, 
                      width: 18, 
                      height: 18, 
                      borderRadius: "50%", 
                      background: c.color, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      boxShadow: `0 2px 10px ${c.color}`, 
                      animation: "badgeIn .22s ease" 
                    }}>
                      <svg width="9" height="9" viewBox="0 0 10 10">
                        <path d="M1.5 5L4 7.5 8.5 2.5" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <div style={{ 
                    position: "absolute", 
                    top: 4, 
                    left: 4, 
                    zIndex: 3, 
                    fontSize: 13, 
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" 
                  }}>
                    {c.icon}
                  </div>
                  <div style={{ 
                    position: "relative", 
                    zIndex: 2, 
                    height: "100%", 
                    display: "flex", 
                    flexDirection: "column", 
                    justifyContent: "flex-end",
                    padding: "0 0 8px 5px" 
                  }}>
                    <div style={{ 
                      fontSize: 8.5, 
                      fontWeight: 800, 
                      color: "#fff", 
                      textShadow: "0 1px 4px rgba(0,0,0,0.7)", 
                      letterSpacing: -0.2, 
                      lineHeight: 1.2, 
                      marginBottom: 2 
                    }}>
                      {c.name.split(" ")[0]}<br/>{c.name.split(" ").slice(1).join(" ")}
                    </div>
                    {/* Candidate name badge at bottom */}
                    <div style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                      padding: "12px 5px 4px",
                      textAlign: "center"
                    }}>
                      <div style={{
                        fontSize: 7.5,
                        fontWeight: 700,
                        color: "#fff",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {c.party}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Second 5 candidates */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 7 }}>
            {filtered.slice(5, 10).map(c => {
              const isV = candVoted === c.id;
              const locked = candVoted !== null && !isV;
              return (
                <div 
                  key={c.id} 
                  onClick={() => !locked && handleCandVote(c.id)}
                  style={{
                    position: "relative",
                    borderRadius: 14,
                    overflow: "hidden",
                    border: isV ? `2.5px solid ${c.color}` : "2.5px solid rgba(203,213,225,0.4)",
                    cursor: locked ? "not-allowed" : "pointer",
                    transition: "all .25s cubic-bezier(.4,0,.2,1)",
                    boxShadow: isV ? `0 6px 20px ${c.color}40` : "0 3px 10px rgba(0,0,0,0.08)",
                    opacity: locked ? 0.35 : 1,
                    WebkitTapHighlightColor: "transparent",
                    aspectRatio: "1",
                    transform: isV ? "scale(1.02)" : "scale(1)",
                    touchAction: "manipulation"
                  }}
                >
                  <img 
                    src={c.photo} 
                    alt={c.name} 
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      zIndex: 0,
                      filter: isV ? "brightness(0.9) saturate(1.3)" : "brightness(0.85) saturate(1)",
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    background: isV ? `linear-gradient(to top, ${c.color}70 0%, transparent 65%)` : "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)",
                  }}/>
                  {isV && (
                    <div style={{ 
                      position: "absolute", 
                      top: 4, 
                      right: 4, 
                      zIndex: 5, 
                      width: 18, 
                      height: 18, 
                      borderRadius: "50%", 
                      background: c.color, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      boxShadow: `0 2px 10px ${c.color}`, 
                      animation: "badgeIn .22s ease" 
                    }}>
                      <svg width="9" height="9" viewBox="0 0 10 10">
                        <path d="M1.5 5L4 7.5 8.5 2.5" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <div style={{ 
                    position: "absolute", 
                    top: 4, 
                    left: 4, 
                    zIndex: 3, 
                    fontSize: 13, 
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" 
                  }}>
                    {c.icon}
                  </div>
                  <div style={{ 
                    position: "relative", 
                    zIndex: 2, 
                    height: "100%", 
                    display: "flex", 
                    flexDirection: "column", 
                    justifyContent: "flex-end",
                    padding: "0 0 8px 5px" 
                  }}>
                    <div style={{ 
                      fontSize: 8.5, 
                      fontWeight: 800, 
                      color: "#fff", 
                      textShadow: "0 1px 4px rgba(0,0,0,0.7)", 
                      letterSpacing: -0.2, 
                      lineHeight: 1.2, 
                      marginBottom: 2 
                    }}>
                      {c.name.split(" ")[0]}<br/>{c.name.split(" ").slice(1).join(" ")}
                    </div>
                    {/* Candidate name badge at bottom */}
                    <div style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                      padding: "12px 5px 4px",
                      textAlign: "center"
                    }}>
                      <div style={{
                        fontSize: 7.5,
                        fontWeight: 700,
                        color: "#fff",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {c.party}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.6 }}>🔍</div>
              {t('noCandidatesFound')}
            </div>
          )}
        </div>

        {/* ── MARQUEE — only real voters ── */}
        <div style={{ marginTop: "auto", paddingBottom: 18 }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: 8, 
            paddingBottom: 6, 
            borderBottom: "2px solid rgba(203,213,225,0.3)" 
          }}>
            <span style={{ 
              fontSize: 9.5, 
              color: "#64748b", 
              textTransform: "uppercase", 
              letterSpacing: 1.2, 
              fontWeight: 700 
            }}>
              {t('liveActivity')}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button 
                onClick={() => {
                  fetchAllVotes();
                  setShowAllVotesModal(true);
                }}
                style={{ 
                  background: "linear-gradient(135deg,rgba(14,165,233,0.2),rgba(14,165,233,0.15))", 
                  border: "1px solid rgba(14,165,233,0.4)", 
                  borderRadius: 8, 
                  padding: "4px 8px", 
                  color: "#0284c7", 
                  fontSize: 8.5, 
                  fontWeight: 700, 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 3, 
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  transition: "all .2s"
                }}
              >
                <span style={{ fontSize: 9 }}>📋</span>
                {t('seeAllVotes')}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ 
                  width: 5, 
                  height: 5, 
                  borderRadius: "50%", 
                  background: "#10b981", 
                  boxShadow: "0 0 6px #10b981", 
                  animation: "livePulse 1.8s ease-in-out infinite" 
                }}/>
                <span style={{ 
                  fontSize: 9, 
                  color: "#64748b", 
                  fontWeight: 600 
                }}>
                  {marqueeItems.length} {marqueeItems.length === 1 ? t('votes').slice(0, -1) : t('votes')}
                </span>
              </div>
            </div>
          </div>

          {marqueeItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0 6px" }}>
              <div style={{ fontSize: 20, opacity: 0.4, marginBottom: 6 }}>🗳️</div>
              <span style={{ 
                fontSize: 11, 
                color: "#94a3b8", 
                lineHeight: 1.5, 
                fontWeight: 500 
              }}>
                {t('noVotesYet')}<br/>{t('beFirstToVote')}
              </span>
            </div>
          ) : (
            <div style={{ height: 66, overflow: "hidden", position: "relative" }}>
              {/* First row - moving left to right */}
              <div style={{ 
                overflow: "hidden", 
                height: 22, 
                marginBottom: 3 
              }}>
                <div style={{ 
                  display: "flex", 
                  whiteSpace: "nowrap", 
                  animation: `marquee0 ${Math.max(15, marqueeItems.length * 3)}s linear infinite` 
                }}>
                  {[...marqueeItems, ...marqueeItems].map((item, idx) => (
                    <span key={`row0-${idx}`} style={{ 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: 5, 
                      flexShrink: 0, 
                      paddingRight: 24 
                    }}>
                      <span style={{ fontSize: 12 }}>{item.icon}</span>
                      <span style={{ 
                        fontSize: 10.5, 
                        color: "#475569", 
                        fontWeight: 700 
                      }}>
                        {item.name}
                      </span>
                      <span style={{ 
                        fontSize: 9, 
                        color: "#94a3b8", 
                        fontWeight: 500 
                      }}>
                        {language === 'ne' ? 'ले मत दिए' : 'voted for'}
                      </span>
                      <span style={{ 
                        fontSize: 10.5, 
                        color: "#7c3aed", 
                        fontWeight: 700 
                      }}>
                        {item.party}
                      </span>
                      <span style={{ color: "#cbd5e1", fontSize: 9 }}>•</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Second row - moving right to left */}
              <div style={{ 
                overflow: "hidden", 
                height: 22, 
                marginBottom: 3 
              }}>
                <div style={{ 
                  display: "flex", 
                  whiteSpace: "nowrap", 
                  animation: `marquee1 ${Math.max(18, marqueeItems.length * 3.5)}s linear infinite` 
                }}>
                  {[...marqueeItems, ...marqueeItems].map((item, idx) => (
                    <span key={`row1-${idx}`} style={{ 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: 5, 
                      flexShrink: 0, 
                      paddingRight: 24 
                    }}>
                      <span style={{ fontSize: 12 }}>{item.icon}</span>
                      <span style={{ 
                        fontSize: 10.5, 
                        color: "#475569", 
                        fontWeight: 700 
                      }}>
                        {item.name}
                      </span>
                      <span style={{ 
                        fontSize: 9, 
                        color: "#94a3b8", 
                        fontWeight: 500 
                      }}>
                        {language === 'ne' ? 'को मत' : 'chose'}
                      </span>
                      <span style={{ 
                        fontSize: 10.5, 
                        color: "#0ea5e9", 
                        fontWeight: 700 
                      }}>
                        {item.party}
                      </span>
                      <span style={{ color: "#cbd5e1", fontSize: 9 }}>•</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Third row - moving left to right */}
              <div style={{ 
                overflow: "hidden", 
                height: 22 
              }}>
                <div style={{ 
                  display: "flex", 
                  whiteSpace: "nowrap", 
                  animation: `marquee2 ${Math.max(20, marqueeItems.length * 4)}s linear infinite` 
                }}>
                  {[...marqueeItems, ...marqueeItems].map((item, idx) => (
                    <span key={`row2-${idx}`} style={{ 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: 5, 
                      flexShrink: 0, 
                      paddingRight: 24 
                    }}>
                      <span style={{ fontSize: 12 }}>{item.icon}</span>
                      <span style={{ 
                        fontSize: 10.5, 
                        color: "#475569", 
                        fontWeight: 700 
                      }}>
                        {item.name}
                      </span>
                      <span style={{ 
                        fontSize: 9, 
                        color: "#94a3b8", 
                        fontWeight: 500 
                      }}>
                        {language === 'ne' ? 'ले समर्थन गरे' : 'supported'}
                      </span>
                      <span style={{ 
                        fontSize: 10.5, 
                        color: "#10b981", 
                        fontWeight: 700 
                      }}>
                        {item.party}
                      </span>
                      <span style={{ color: "#cbd5e1", fontSize: 9 }}>•</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── MODERN FOOTER ── */}
        <div style={{ 
          borderTop: "2px solid rgba(203,213,225,0.3)", 
          paddingTop: 14, 
          paddingBottom: 14, 
          marginTop: 10, 
          background: "rgba(255,255,255,0.3)", 
          borderRadius: "12px 12px 0 0", 
          marginLeft: -14, 
          marginRight: -14, 
          paddingLeft: 14, 
          paddingRight: 14 
        }}>
          {/* Feedback Button Row */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid rgba(203,213,225,0.2)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button 
                onClick={() => setShowFeedback(!showFeedback)}
                style={{ 
                  background: "linear-gradient(135deg,rgba(139,92,246,0.2),rgba(139,92,246,0.15))", 
                  border: "1px solid rgba(139,92,246,0.4)", 
                  borderRadius: 10, 
                  padding: "6px 12px", 
                  color: "#6d28d9", 
                  fontSize: 10, 
                  fontWeight: 700, 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 4, 
                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                  transition: "all .2s"
                }}
              >
                <span style={{ fontSize: 12 }}>💬</span>
                Feedback ({feedbackCount})
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d={showFeedback ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}/>
                </svg>
              </button>
            </div>
            
            <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 500 }}>
              {feedbacks.length > 0 && `${feedbacks.length} comments`}
            </div>
          </div>

          {/* Feedback Input Section */}
          {showFeedback && (
            <div style={{ 
              marginTop: 12,
              animation: "fadeIn .3s ease"
            }}>
              {/* Feedback Input */}
              <div style={{ 
                background: "rgba(255,255,255,0.8)", 
                borderRadius: 12, 
                padding: "10px", 
                border: "1px solid rgba(203,213,225,0.5)",
                marginBottom: 10
              }}>
                <textarea
                  placeholder="Share your feedback or suggestions..."
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  maxLength={500}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#1e293b",
                    fontSize: 12,
                    minHeight: 60,
                    resize: "vertical",
                    fontFamily: "inherit",
                    lineHeight: 1.4
                  }}
                />
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  marginTop: 8 
                }}>
                  <span style={{ 
                    fontSize: 9, 
                    color: feedbackMessage.length >= 500 ? "#ef4444" : "#64748b" 
                  }}>
                    {feedbackMessage.length}/500
                  </span>
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={!feedbackMessage.trim() || feedbackLoading}
                    style={{ 
                      background: !feedbackMessage.trim() || feedbackLoading 
                        ? "rgba(203,213,225,0.5)" 
                        : "linear-gradient(135deg,#8b5cf6,#6366f1)", 
                      border: "none", 
                      borderRadius: 8, 
                      padding: "6px 16px", 
                      color: "#fff", 
                      fontSize: 11, 
                      fontWeight: 600, 
                      cursor: !feedbackMessage.trim() || feedbackLoading ? "not-allowed" : "pointer", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 4,
                      opacity: !feedbackMessage.trim() || feedbackLoading ? 0.6 : 1,
                      transition: "all .2s"
                    }}
                  >
                    {feedbackLoading ? (
                      <>
                        <div className="loading-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </>
                    ) : (
                      <>
                        Send
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M22 2L11 13"/>
                          <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Feedback List */}
              <div style={{ 
                maxHeight: 300, 
                overflowY: "auto",
                paddingRight: 4
              }}>
                {feedbacks.length === 0 ? (
                  <div style={{ 
                    textAlign: "center", 
                    padding: "20px 0", 
                    color: "#94a3b8", 
                    fontSize: 11 
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>💬</div>
                    No feedback yet. Be the first to share!
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {displayedFeedbacks.map((feedback, index) => (
                      <div 
                        key={index}
                        style={{ 
                          background: "rgba(255,255,255,0.7)", 
                          borderRadius: 10, 
                          padding: "10px", 
                          border: "1px solid rgba(203,213,225,0.3)",
                          animation: "fadeIn .3s ease",
                          animationDelay: `${index * 0.05}s`
                        }}
                      >
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "flex-start", 
                          marginBottom: 6 
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ 
                              width: 20, 
                              height: 20, 
                              borderRadius: "50%", 
                              background: "linear-gradient(135deg,#f0abfc,#a78bfa)", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              fontSize: 10, 
                              color: "#fff", 
                              fontWeight: 700 
                            }}>
                              {feedback.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ 
                                fontSize: 10.5, 
                                fontWeight: 700, 
                                color: "#475569" 
                              }}>
                                {feedback.name}
                              </div>
                              <div style={{ 
                                fontSize: 8, 
                                color: "#94a3b8", 
                                marginTop: 1 
                              }}>
                                {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                          {feedback.status === 'replied' && (
                            <div style={{ 
                              background: "rgba(16,185,129,0.1)", 
                              border: "1px solid rgba(16,185,129,0.3)", 
                              borderRadius: 6, 
                              padding: "2px 6px", 
                              fontSize: 8, 
                              color: "#059669", 
                              fontWeight: 600 
                            }}>
                              Replied
                            </div>
                          )}
                        </div>
                        
                        <div style={{ 
                          fontSize: 11, 
                          color: "#4b5563", 
                          lineHeight: 1.4, 
                          marginBottom: 8 
                        }}>
                          {feedback.message}
                        </div>
                        
                        {feedback.adminReply && (
                          <div style={{ 
                            background: "rgba(249,250,251,0.9)", 
                            borderRadius: 8, 
                            padding: "8px", 
                            borderLeft: "3px solid #10b981",
                            marginTop: 8
                          }}>
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: 4, 
                              marginBottom: 4 
                            }}>
                              <span style={{ fontSize: 10, color: "#059669" }}>✅</span>
                              <span style={{ 
                                fontSize: 9, 
                                color: "#059669", 
                                fontWeight: 700 
                              }}>
                                Admin Reply
                              </span>
                            </div>
                            <div style={{ 
                              fontSize: 10.5, 
                              color: "#374151", 
                              lineHeight: 1.3 
                            }}>
                              {feedback.adminReply}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* View More/Less Button */}
                {feedbacks.length > 10 && (
                  <div style={{ textAlign: "center", marginTop: 12 }}>
                    <button
                      onClick={() => setShowAllFeedbacks(!showAllFeedbacks)}
                      style={{
                        background: "linear-gradient(135deg,rgba(14,165,233,0.2),rgba(14,165,233,0.15))",
                        border: "1px solid rgba(14,165,233,0.4)",
                        borderRadius: 8,
                        padding: "6px 16px",
                        color: "#0284c7",
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        margin: "0 auto",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.06)"
                      }}
                    >
                      {showAllFeedbacks ? t('viewLess') : t('viewMore')}
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d={showAllFeedbacks ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            marginBottom: 10 
          }}>
            <div style={{ 
              fontSize: 8.5, 
              color: "#64748b", 
              letterSpacing: 0.3, 
              fontWeight: 600 
            }}>
              {t('copyright')}
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              <a 
                href="https://www.facebook.com/abhishek.razwanc" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  width: 22, 
                  height: 22, 
                  borderRadius: "50%", 
                  background: "rgba(59,130,246,0.15)", 
                  border: "1px solid rgba(59,130,246,0.3)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  textDecoration: "none", 
                  transition: "all .2s" 
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#3B82F6">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://www.tiktok.com/@engineerbeta?is_from_webapp=1&sender_device=pc" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  width: 22, 
                  height: 22, 
                  borderRadius: "50%", 
                  background: "rgba(0,0,0,0.1)", 
                  border: "1px solid rgba(0,0,0,0.15)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  textDecoration: "none", 
                  transition: "all .2s" 
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#000">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v小三 3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a 
                href="https://wa.me/9779824380896" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  width: 22, 
                  height: 22, 
                  borderRadius: "50%", 
                  background: "rgba(34,197,94,0.15)", 
                  border: "1px solid rgba(34,197,94,0.3)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  textDecoration: "none", 
                  transition: "all .2s" 
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#22C55E">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
            </div>
          </div>
          <div style={{ 
            fontSize: 8, 
            color: "#94a3b8", 
            textAlign: "center", 
            lineHeight: 1.4, 
            fontWeight: 500,
            marginTop: showFeedback ? 12 : 0
          }}>
            Made by Abhishek ❤️ for democratic Nepal
          </div>
        </div>
      </div>

      {/* ══════════════════ MODALS ══════════════════ */}
      
      {/* VOTE COUNT TABLE MODAL */}
      {showTipsModal && (
        <div style={{ 
          position: "fixed", 
          inset: 0, 
          zIndex: 500, 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "flex-end", 
          maxWidth: 375, 
          margin: "0 auto", 
          left: 0, 
          right: 0 
        }}>
          <div 
            onClick={() => setShowTipsModal(false)} 
            style={{ 
              flex: 1, 
              background: "rgba(0,0,0,0.4)", 
              backdropFilter: "blur(4px)", 
              animation: "fadeIn .25s ease" 
            }}
          />
          <div style={{ 
            background: "linear-gradient(180deg, #fefefe 0%, #f8fafc 100%)", 
            borderRadius: "24px 24px 0 0", 
            paddingBottom: 32, 
            animation: "sheetUp .35s cubic-bezier(.4,0,.2,1)", 
            maxHeight: "70vh", 
            overflowY: "auto", 
            boxShadow: "0 -10px 40px rgba(0,0,0,0.15)" 
          }}>
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 8 }}>
              <div style={{ 
                width: 40, 
                height: 4, 
                borderRadius: 3, 
                background: "rgba(100,116,139,0.2)" 
              }}/>
            </div>
            <div style={{ padding: "0 20px" }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: 16 
              }}>
                <div>
                  <h2 style={{ 
                    margin: 0, 
                    fontSize: 19, 
                    fontWeight: 800, 
                    color: "#1e293b", 
                    letterSpacing: -0.4 
                  }}>
                    {t('voteCountTitle')}
                  </h2>
                  <span style={{ 
                    fontSize: 11, 
                    color: "#64748b", 
                    fontWeight: 500 
                  }}>
                    {t('totalVotes')} {voteStats.totalVotes}
                  </span>
                </div>
                <button 
                  onClick={() => setShowTipsModal(false)} 
                  style={{ 
                    background: "rgba(100,116,139,0.1)", 
                    border: "1px solid rgba(100,116,139,0.2)", 
                    borderRadius: "50%", 
                    width: 32, 
                    height: 32, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    cursor: "pointer", 
                    color: "#64748b", 
                    fontSize: 18, 
                    fontWeight: 700 
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sortedCandidates.map((c, idx) => {
                  const percentage = voteStats.totalVotes > 0 ? ((c.votes / voteStats.totalVotes) * 100).toFixed(1) : 0;
                  return (
                    <div key={c.id} style={{ 
                      background: "rgba(255,255,255,0.8)", 
                      border: `1.5px solid ${c.color}30`, 
                      borderRadius: 14, 
                      padding: "12px 14px", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 12,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      position: "relative",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${percentage}%`,
                        background: `${c.color}15`,
                        transition: "width 0.3s ease"
                      }}/>
                      <div style={{ 
                        position: "relative",
                        zIndex: 1,
                        width: 24, 
                        height: 24, 
                        borderRadius: "50%", 
                        background: `${c.color}25`, 
                        border: `2px solid ${c.color}`, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontSize: 10, 
                        fontWeight: 800, 
                        color: c.color,
                        flexShrink: 0 
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ position: "relative", zIndex: 1, fontSize: 14, flexShrink: 0 }}>{c.icon}</div>
                      <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontSize: 12, 
                          fontWeight: 800, 
                          color: "#1e293b", 
                          letterSpacing: -0.2, 
                          whiteSpace: "nowrap", 
                          overflow: "hidden", 
                          textOverflow: "ellipsis" 
                        }}>
                          {c.name}
                        </div>
                        <div style={{ 
                          fontSize: 9, 
                          color: "#64748b", 
                          fontWeight: 500, 
                          whiteSpace: "nowrap", 
                          overflow: "hidden", 
                          textOverflow: "ellipsis" 
                        }}>
                          {c.party}
                        </div>
                      </div>
                      <div style={{ position: "relative", zIndex: 1, textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: c.color, lineHeight: 1 }}>
                          {c.votes}
                        </div>
                        <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600 }}>
                          {percentage}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEE ALL VOTES MODAL */}
      {showAllVotesModal && (
        <div style={{ 
          position: "fixed", 
          inset: 0, 
          zIndex: 500, 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "flex-end", 
          maxWidth: 375, 
          margin: "0 auto", 
          left: 0, 
          right: 0 
        }}>
          <div 
            onClick={() => setShowAllVotesModal(false)} 
            style={{ 
              flex: 1, 
              background: "rgba(0,0,0,0.4)", 
              backdropFilter: "blur(4px)", 
              animation: "fadeIn .25s ease" 
            }}
          />
          <div style={{ 
            background: "linear-gradient(180deg, #fefefe 0%, #f8fafc 100%)", 
            borderRadius: "24px 24px 0 0", 
            paddingBottom: 32, 
            animation: "sheetUp .35s cubic-bezier(.4,0,.2,1)", 
            maxHeight: "80vh", 
            overflowY: "auto", 
            boxShadow: "0 -10px 40px rgba(0,0,0,0.15)" 
          }}>
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 8 }}>
              <div style={{ 
                width: 40, 
                height: 4, 
                borderRadius: 3, 
                background: "rgba(100,116,139,0.2)" 
              }}/>
            </div>
            <div style={{ padding: "0 20px" }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: 16 
              }}>
                <div>
                  <h2 style={{ 
                    margin: 0, 
                    fontSize: 19, 
                    fontWeight: 800, 
                    color: "#1e293b", 
                    letterSpacing: -0.4 
                  }}>
                    {t('seeAllVotesTitle')}
                  </h2>
                  <span style={{ 
                    fontSize: 11, 
                    color: "#64748b", 
                    fontWeight: 500 
                  }}>
                    {t('totalVotes')} {allVotesData.length}
                  </span>
                </div>
                <button 
                  onClick={() => setShowAllVotesModal(false)} 
                  style={{ 
                    background: "rgba(100,116,139,0.1)", 
                    border: "1px solid rgba(100,116,139,0.2)", 
                    borderRadius: "50%", 
                    width: 32, 
                    height: 32, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    cursor: "pointer", 
                    color: "#64748b", 
                    fontSize: 18, 
                    fontWeight: 700 
                  }}
                >
                  ×
                </button>
              </div>

              {/* Votes Table */}
              <div style={{ 
                background: "rgba(255,255,255,0.8)", 
                borderRadius: 14, 
                overflow: "hidden", 
                border: "1px solid rgba(203,213,225,0.5)",
                maxHeight: 400,
                overflowY: "auto"
              }}>
                {/* Table Header */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "3fr 2fr 2fr 1.5fr", 
                  background: "linear-gradient(135deg,rgba(14,165,233,0.1),rgba(14,165,233,0.05))", 
                  borderBottom: "2px solid rgba(14,165,233,0.3)", 
                  padding: "10px 12px",
                  position: "sticky",
                  top: 0,
                  zIndex: 1
                }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>{t('voterName')}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>{t('candidateVoted')}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>{t('party')}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>{t('time')}</span>
                </div>

                {/* Table Rows */}
                <div>
                  {allVotesData.map((vote, index) => {
                    const candidate = CANDIDATES.find(c => 
                      c.party === vote.candidateParty || 
                      c.name === vote.candidateName
                    );
                    const timeAgo = (dateString) => {
                      const now = new Date();
                      const then = new Date(dateString);
                      const diffMs = now - then;
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffHours = Math.floor(diffMs / 3600000);
                      const diffDays = Math.floor(diffMs / 86400000);
                      
                      if (diffMins < 60) return `${diffMins}m`;
                      if (diffHours < 24) return `${diffHours}h`;
                      return `${diffDays}d`;
                    };

                    return (
                      <div 
                        key={index}
                        style={{ 
                          display: "grid", 
                          gridTemplateColumns: "3fr 2fr 2fr 1.5fr", 
                          padding: "10px 12px", 
                          borderBottom: "1px solid rgba(203,213,225,0.3)",
                          background: index % 2 === 0 ? "rgba(255,255,255,0.5)" : "rgba(249,250,251,0.5)",
                          alignItems: "center"
                        }}
                      >
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {vote.name}
                        </span>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: candidate?.color || "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {vote.candidateName}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 500, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {vote.candidateParty}
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 500, color: "#94a3b8" }}>
                          {timeAgo(vote.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button 
                onClick={() => setShowAllVotesModal(false)} 
                style={{ 
                  width: "100%", 
                  background: "linear-gradient(135deg,rgba(100,116,139,0.2),rgba(100,116,139,0.15))", 
                  border: "1px solid rgba(100,116,139,0.3)", 
                  borderRadius: 14, 
                  padding: "12px 0", 
                  color: "#64748b", 
                  fontSize: 14, 
                  fontWeight: 800, 
                  cursor: "pointer", 
                  marginTop: 20, 
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)" 
                }}
              >
                {t('back')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER MODAL */}
      {showSheet && sheetPage === "register" && (
        <div style={{ 
          position: "fixed", 
          inset: 0, 
          zIndex: 500, 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "flex-end", 
          maxWidth: 375, 
          margin: "0 auto", 
          left: 0, 
          right: 0 
        }}>
          <div 
            onClick={() => setShowSheet(false)} 
            style={{ 
              flex: 1, 
              background: "rgba(0,0,0,0.4)", 
              backdropFilter: "blur(4px)", 
              animation: "fadeIn .25s ease" 
            }}
          />
          <div style={{ 
            background: "linear-gradient(180deg, #fefefe 0%, #f8fafc 100%)", 
            borderRadius: "24px 24px 0 0", 
            paddingBottom: 32, 
            animation: "sheetUp .35s cubic-bezier(.4,0,.2,1)", 
            boxShadow: "0 -10px 40px rgba(0,0,0,0.15)" 
          }}>
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 8 }}>
              <div style={{ 
                width: 40, 
                height: 4, 
                borderRadius: 3, 
                background: "rgba(100,116,139,0.2)" 
              }}/>
            </div>
            <div style={{ padding: "0 20px" }}>
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🗳️</div>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: 20, 
                  fontWeight: 800, 
                  color: "#1e293b", 
                  letterSpacing: -0.4 
                }}>
                  {t('registerModalTitle')}
                </h2>
                <p style={{ 
                  margin: "6px 0 0", 
                  fontSize: 12, 
                  color: "#64748b", 
                  lineHeight: 1.5, 
                  fontWeight: 500 
                }}>
                  {t('registerModalDesc')}
                </p>
              </div>

              <label style={{ 
                display: "block", 
                fontSize: 10.5, 
                color: "#64748b", 
                textTransform: "uppercase", 
                letterSpacing: 1, 
                fontWeight: 700, 
                marginBottom: 6 
              }}>
                {t('nameLabel')}
              </label>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <span style={{ 
                  position: "absolute", 
                  left: 14, 
                  top: "50%", 
                  transform: "translateY(-50%)", 
                  fontSize: 16, 
                  pointerEvents: "none" 
                }}>
                  👤
                </span>
                <input 
                  type="text" 
                  placeholder={t('namePlaceholder')}
                  value={user.name} 
                  onChange={e => setUser(p => ({ ...p, name: e.target.value }))}
                  style={{ 
                    width: "100%", 
                    background: "rgba(255,255,255,0.9)", 
                    border: "1.5px solid rgba(203,213,225,0.5)", 
                    borderRadius: 14, 
                    padding: "12px 16px 12px 42px", 
                    color: "#1e293b", 
                    fontSize: 14, 
                    outline: "none", 
                    boxSizing: "border-box", 
                    fontWeight: 500, 
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)" 
                  }}
                />
              </div>

              <label style={{ 
                display: "block", 
                fontSize: 10.5, 
                color: "#64748b", 
                textTransform: "uppercase", 
                letterSpacing: 1, 
                fontWeight: 700, 
                marginBottom: 6 
              }}>
                {t('ageLabel')}
              </label>
              <div style={{ position: "relative", marginBottom: 18 }}>
                <span style={{ 
                  position: "absolute", 
                  left: 14, 
                  top: "50%", 
                  transform: "translateY(-50%)", 
                  fontSize: 16, 
                  pointerEvents: "none" 
                }}>
                  🎂
                </span>
                <input 
                  type="number" 
                  placeholder={t('agePlaceholder')}
                  min="1" 
                  max="100" 
                  value={user.age} 
                  onChange={e => setUser(p => ({ ...p, age: e.target.value }))}
                  style={{ 
                    width: "100%", 
                    background: "rgba(255,255,255,0.9)", 
                    border: "1.5px solid rgba(203,213,225,0.5)", 
                    borderRadius: 14, 
                    padding: "12px 16px 12px 42px", 
                    color: "#1e293b", 
                    fontSize: 14, 
                    outline: "none", 
                    boxSizing: "border-box", 
                    fontWeight: 500, 
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)" 
                  }}
                />
              </div>

              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 8, 
                background: "rgba(239,68,68,0.1)", 
                border: "1.5px solid rgba(239,68,68,0.25)", 
                borderRadius: 12, 
                padding: "10px 12px", 
                marginBottom: 20 
              }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span style={{ 
                  fontSize: 11.5, 
                  color: "#dc2626", 
                  lineHeight: 1.4, 
                  fontWeight: 600 
                }}>
                  {t('ageWarning')}
                </span>
              </div>

              <button 
                onClick={handleRegister} 
                style={{ 
                  width: "100%", 
                  background: "linear-gradient(135deg,#ec4899,#0ea5e9)", 
                  border: "none", 
                  borderRadius: 14, 
                  padding: "14px 0", 
                  color: "#fff", 
                  fontSize: 15, 
                  fontWeight: 800, 
                  cursor: "pointer", 
                  boxShadow: "0 6px 20px rgba(236,72,153,0.35)", 
                  transition: "all .2s" 
                }}
              >
                {t('registerNow')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div style={{ 
          position: "fixed", 
          inset: 0, 
          zIndex: 500, 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "flex-end", 
          maxWidth: 375, 
          margin: "0 auto", 
          left: 0, 
          right: 0 
        }}>
          <div 
            onClick={() => setShowLogoutModal(false)} 
            style={{ 
              flex: 1, 
              background: "rgba(0,0,0,0.4)", 
              backdropFilter: "blur(4px)", 
              animation: "fadeIn .25s ease" 
            }}
          />
          <div style={{ 
            background: "linear-gradient(180deg, #fefefe 0%, #f8fafc 100%)", 
            borderRadius: "24px 24px 0 0", 
            paddingBottom: 32, 
            animation: "sheetUp .35s cubic-bezier(.4,0,.2,1)", 
            boxShadow: "0 -10px 40px rgba(0,0,0,0.15)" 
          }}>
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 8 }}>
              <div style={{ 
                width: 40, 
                height: 4, 
                borderRadius: 3, 
                background: "rgba(100,116,139,0.2)" 
              }}/>
            </div>
            <div style={{ padding: "0 20px" }}>
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: 20, 
                  fontWeight: 800, 
                  color: "#1e293b", 
                  letterSpacing: -0.4 
                }}>
                  {t('logoutModalTitle')}
                </h2>
                <p style={{ 
                  margin: "6px 0 0", 
                  fontSize: 12, 
                  color: "#64748b", 
                  lineHeight: 1.5, 
                  fontWeight: 500 
                }}>
                  {t('logoutModalDesc')}
                </p>
              </div>

              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 8, 
                background: "rgba(239,68,68,0.1)", 
                border: "1.5px solid rgba(239,68,68,0.25)", 
                borderRadius: 12, 
                padding: "10px 12px", 
                marginBottom: 20 
              }}>
                <span style={{ fontSize: 16 }}>🔒</span>
                <span style={{ 
                  fontSize: 11.5, 
                  color: "#dc2626", 
                  lineHeight: 1.4, 
                  fontWeight: 600 
                }}>
                  {t('logoutWarning')}
                </span>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button 
                  onClick={() => setShowLogoutModal(false)} 
                  style={{ 
                    flex: 1, 
                    background: "linear-gradient(135deg,rgba(100,116,139,0.2),rgba(100,116,139,0.15))", 
                    border: "1px solid rgba(100,116,139,0.3)", 
                    borderRadius: 14, 
                    padding: "14px 0", 
                    color: "#64748b", 
                    fontSize: 15, 
                    fontWeight: 800, 
                    cursor: "pointer", 
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)", 
                    transition: "all .2s" 
                  }}
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={handleLogout} 
                  style={{ 
                    flex: 1, 
                    background: "linear-gradient(135deg,#ef4444,#dc2626)", 
                    border: "none", 
                    borderRadius: 14, 
                    padding: "14px 0", 
                    color: "#fff", 
                    fontSize: 15, 
                    fontWeight: 800, 
                    cursor: "pointer", 
                    boxShadow: "0 6px 20px rgba(239,68,68,0.35)", 
                    transition: "all .2s" 
                  }}
                >
                  {t('confirmLogout')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXIT CONFIRMATION MODAL */}
      {showExitModal && (
        <div style={{ 
          position: "fixed", 
          inset: 0, 
          zIndex: 500, 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "flex-end", 
          maxWidth: 375, 
          margin: "0 auto", 
          left: 0, 
          right: 0 
        }}>
          <div 
            onClick={() => setShowExitModal(false)} 
            style={{ 
              flex: 1, 
              background: "rgba(0,0,0,0.5)", 
              backdropFilter: "blur(4px)", 
              animation: "fadeIn .25s ease" 
            }}
          />
          <div style={{ 
            background: "linear-gradient(180deg, #fefefe 0%, #f8fafc 100%)", 
            borderRadius: "24px 24px 0 0", 
            paddingBottom: 32, 
            animation: "sheetUp .35s cubic-bezier(.4,0,.2,1)", 
            boxShadow: "0 -10px 40px rgba(0,0,0,0.15)" 
          }}>
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 8 }}>
              <div style={{ 
                width: 40, 
                height: 4, 
                borderRadius: 3, 
                background: "rgba(100,116,139,0.2)" 
              }}/>
            </div>
            <div style={{ padding: "0 20px" }}>
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🚪</div>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: 20, 
                  fontWeight: 800, 
                  color: "#1e293b", 
                  letterSpacing: -0.4 
                }}>
                  {t('exitModalTitle')}
                </h2>
                <p style={{ 
                  margin: "6px 0 0", 
                  fontSize: 12, 
                  color: "#64748b", 
                  lineHeight: 1.5, 
                  fontWeight: 500 
                }}>
                  {t('exitModalDesc')}
                </p>
              </div>

              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 8, 
                background: "rgba(239,68,68,0.1)", 
                border: "1.5px solid rgba(239,68,68,0.25)", 
                borderRadius: 12, 
                padding: "10px 12px", 
                marginBottom: 20 
              }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span style={{ 
                  fontSize: 11.5, 
                  color: "#dc2626", 
                  lineHeight: 1.4, 
                  fontWeight: 600 
                }}>
                  {t('logoutWarning')}
                </span>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button 
                  onClick={() => setShowExitModal(false)} 
                  style={{ 
                    flex: 1, 
                    background: "linear-gradient(135deg,rgba(100,116,139,0.2),rgba(100,116,139,0.15))", 
                    border: "1px solid rgba(100,116,139,0.3)", 
                    borderRadius: 14, 
                    padding: "14px 0", 
                    color: "#64748b", 
                    fontSize: 15, 
                    fontWeight: 800, 
                    cursor: "pointer", 
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)", 
                    transition: "all .2s" 
                  }}
                >
                  {t('stay')}
                </button>
                <button 
                  onClick={handleExit} 
                  style={{ 
                    flex: 1, 
                    background: "linear-gradient(135deg,#ef4444,#dc2626)", 
                    border: "none", 
                    borderRadius: 14, 
                    padding: "14px 0", 
                    color: "#fff", 
                    fontSize: 15, 
                    fontWeight: 800, 
                    cursor: "pointer", 
                    boxShadow: "0 6px 20px rgba(239,68,68,0.35)", 
                    transition: "all .2s" 
                  }}
                >
                  {t('confirmExit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            borderRadius: 16,
            padding: "24px",
            textAlign: "center",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗳️</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
              {language === 'ne' ? 'तपाईंको मत प्रक्रियामा...' : 'Processing your vote...'}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
              {language === 'ne' ? 'कृपया प्रतीक्षा गर्नुहोस्' : 'Please wait'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
