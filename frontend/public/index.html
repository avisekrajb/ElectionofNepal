<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Nepal Election 2026 - Cast your vote online"
    />
    <title>Nepal Election 2026</title>
    <style>
      /* Loader Styles */
      #loader-wrapper {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0d1b3e 0%, #1a3a6c 100%);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        transition: opacity 0.5s ease-out;
      }
      
      .loader-container {
        text-align: center;
        color: white;
        padding: 20px;
      }
      
      .flag-container {
        position: relative;
        width: 200px;
        height: 130px;
        margin: 0 auto 30px;
        animation: flag-float 3s infinite ease-in-out;
        filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.3));
      }
      
      .flag-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      
      .flag-glow {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(ellipse at center, rgba(220, 20, 60, 0.3) 0%, transparent 70%);
        z-index: -1;
        animation: pulse-glow 2s infinite alternate;
      }
      
      .loader-text {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin-bottom: 30px;
      }
      
      .main-title {
        font-size: 2.8rem;
        font-weight: bold;
        margin-bottom: 10px;
        text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
        background: linear-gradient(to right, #ffcc00, #ffd700, #ffffff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: 1.5px;
        position: relative;
      }
      
      .main-title::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 25%;
        width: 50%;
        height: 3px;
        background: linear-gradient(to right, transparent, #ffcc00, transparent);
        border-radius: 2px;
      }
      
      .subtitle {
        font-size: 1.4rem;
        opacity: 0.9;
        letter-spacing: 1px;
        margin-top: 15px;
        color: #ffd700;
        font-weight: 500;
      }
      
      .devnagari-title {
        font-size: 2.2rem;
        margin-bottom: 15px;
        color: #ffffff;
        text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.5);
        font-weight: 600;
      }
      
      .loading-bar-container {
        width: 350px;
        margin: 30px auto;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 15px;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .loading-text {
        font-size: 0.9rem;
        margin-bottom: 10px;
        color: #ffcc00;
        display: flex;
        justify-content: space-between;
      }
      
      .loading-bar {
        width: 100%;
        height: 10px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 5px;
        overflow: hidden;
        position: relative;
      }
      
      .loading-progress {
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, #ffcc00, #ff9900, #ff6600);
        border-radius: 5px;
        animation: loading 2s linear forwards;
        position: relative;
        overflow: hidden;
      }
      
      .loading-progress::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, 
          transparent, 
          rgba(255, 255, 255, 0.4), 
          transparent
        );
        animation: shimmer 1.5s infinite;
      }
      
      .percentage {
        position: absolute;
        right: -40px;
        top: 50%;
        transform: translateY(-50%);
        font-weight: bold;
        color: #ffcc00;
        font-size: 0.9rem;
        animation: count-up 2s linear forwards;
      }
      
      .loading-dots {
        display: flex;
        justify-content: center;
        margin: 25px 0;
        gap: 12px;
      }
      
      .dot {
        width: 14px;
        height: 14px;
        background: linear-gradient(135deg, #ffcc00, #ff9900);
        border-radius: 50%;
        animation: bounce 1.4s infinite ease-in-out;
        box-shadow: 0 0 10px rgba(255, 204, 0, 0.5);
      }
      
      .dot:nth-child(1) { animation-delay: -0.32s; }
      .dot:nth-child(2) { animation-delay: -0.16s; }
      
      .election-message {
        margin-top: 25px;
        font-size: 0.95rem;
        opacity: 0.85;
        max-width: 500px;
        text-align: center;
        line-height: 1.6;
        color: #e6e6e6;
        padding: 15px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        border-left: 3px solid #ffcc00;
      }
      
      .secure-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 15px;
        padding: 8px 16px;
        background: rgba(0, 184, 148, 0.2);
        border-radius: 20px;
        font-size: 0.85rem;
        color: #00b894;
        border: 1px solid rgba(0, 184, 148, 0.3);
      }
      
      .fallback-flag {
        width: 100%;
        height: 100%;
        background: linear-gradient(to bottom, #dc143c 33%, white 33%, white 66%, #003893 66%);
        border-radius: 4px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .fallback-flag span {
        color: white;
        font-size: 24px;
      }
      
      /* Animations */
      @keyframes loading {
        0% { width: 0%; }
        25% { width: 30%; }
        50% { width: 65%; }
        75% { width: 85%; }
        100% { width: 100%; }
      }
      
      @keyframes count-up {
        0% { content: "0%"; }
        25% { content: "30%"; }
        50% { content: "65%"; }
        75% { content: "85%"; }
        100% { content: "100%"; }
      }
      
      .percentage::after {
        content: "0%";
        animation: count-up 2s linear forwards;
      }
      
      @keyframes bounce {
        0%, 80%, 100% { 
          transform: scale(0.8);
          opacity: 0.6;
        }
        40% { 
          transform: scale(1.2);
          opacity: 1;
        }
      }
      
      @keyframes flag-float {
        0%, 100% { 
          transform: translateY(0) rotate(0deg);
        }
        50% { 
          transform: translateY(-10px) rotate(1deg);
        }
      }
      
      @keyframes pulse-glow {
        0% { opacity: 0.3; }
        100% { opacity: 0.7; }
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      /* Hide loader */
      .loaded #loader-wrapper {
        opacity: 0;
        pointer-events: none;
      }
      
      /* Root element */
      #root {
        opacity: 0;
        transition: opacity 0.5s ease-in;
      }
      
      .loaded #root {
        opacity: 1;
      }
      
      /* Responsive adjustments */
      @media (max-width: 768px) {
        .flag-container {
          width: 150px;
          height: 100px;
        }
        
        .main-title {
          font-size: 2rem;
        }
        
        .devnagari-title {
          font-size: 1.8rem;
        }
        
        .loading-bar-container {
          width: 280px;
        }
      }
    </style>
  </head>
  <body>
    <!-- Loader -->
    <div id="loader-wrapper">
      <div class="loader-container">
        <div class="flag-container">
          <div class="flag-glow"></div>
          <img 
            src="https://hampshireflag.co.uk/wp-content/uploads/2023/03/HFC20Nepal20Flag.png" 
            alt="Nepal Flag" 
            class="flag-image"
            id="nepal-flag"
          />
        </div>
        
        <div class="loader-text">
          <div class="devnagari-title">नेपाल निर्वाचन २०८३</div>
          <h1 class="main-title">Nepal Election 2026</h1>
          <p class="subtitle">Digital Voting Platform</p>
        </div>
        
        <div class="loading-bar-container">
          <div class="loading-text">
            <span>Initializing System</span>
            <span class="percentage">0%</span>
          </div>
          <div class="loading-bar">
            <div class="loading-progress"></div>
          </div>
        </div>
        
        <div class="loading-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        
        <div class="election-message">
          <strong>Secure Voting System Initialization</strong><br>
          Loading encrypted voting interface and verifying voter credentials...
        </div>
        
        <div class="secure-badge">
          <span>🔒</span>
          <span>Military-Grade Encryption Active</span>
        </div>
      </div>
    </div>
    
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>

    <script>
      // Wait for DOM to be fully loaded
      document.addEventListener('DOMContentLoaded', function() {
        const percentageElement = document.querySelector('.percentage');
        const progressBar = document.querySelector('.loading-progress');
        const nepalFlag = document.getElementById('nepal-flag');
        let progress = 0;
        
        // Handle flag loading error
        if (nepalFlag) {
          nepalFlag.onerror = function() {
            this.style.display = 'none';
            const flagContainer = document.querySelector('.flag-container');
            if (flagContainer) {
              flagContainer.innerHTML = `
                <div class="fallback-flag">
                  <span>🇳🇵</span>
                </div>
                <div class="flag-glow"></div>
              `;
            }
          };
        }
        
        // Update percentage every 100ms
        const interval = setInterval(function() {
          progress += 5;
          if (progress <= 100) {
            percentageElement.textContent = progress + '%';
          }
        }, 100);
        
        // Show loader for exactly 2 seconds
        setTimeout(function() {
          clearInterval(interval);
          percentageElement.textContent = '100%';
          
          // Add loaded class to body to trigger loader fade out
          document.body.classList.add('loaded');
          
          // Remove loader from DOM after animation completes
          setTimeout(function() {
            const loader = document.getElementById('loader-wrapper');
            if (loader) {
              loader.style.display = 'none';
            }
          }, 500); // Wait for opacity transition to complete
        }, 2000); // 2 second loader display
      });
    </script>
  </body>
</html>
