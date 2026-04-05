import React from 'react';

export default function LandingPage() {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="logo-container">
          <img 
            src="/images/logo.png" 
            alt="Dorm Dash Logo" 
            className="logo-img"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = "https://via.placeholder.com/40?text=DD";
            }}
          />
          <span>Dorm Dash</span>
        </div>
        <div className="header-subtitle">
          Group 2 • Property Rental Management System
        </div>
      </header>

      <main className="main-content">
        <div className="content-grid">
          
          <div className="hero-section">
            <h1 className="hero-title">
              Your next home,<br />
              <span className="hero-highlight">
                just a dash away.
              </span>
            </h1>
            <p className="hero-description">
              The smartest way for students and professionals to find, book, and secure their ideal living spaces. 
            </p>
          </div>

          <div className="info-card">
            <h2 className="card-title">
              Discover Verified Properties
            </h2>
            <p className="card-desc">
              Whether you want the privacy of your own space or a vibrant shared community, Dorm Dash connects you directly with landlords for:
            </p>

            <div className="property-grid">
              <div className="property-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-blue"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
                <span className="property-label">Condos</span>
              </div>
              <div className="property-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-emerald"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span className="property-label">Dorms</span>
              </div>
              <div className="property-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-purple"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"></path><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"></path><path d="M12 4v6"></path><path d="M2 18h20"></path></svg>
                <span className="property-label">Bedspaces</span>
              </div>
              <div className="property-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-orange"><path d="M13 4h3a2 2 0 0 1 2 2v14"></path><path d="M2 20h3"></path><path d="M13 20v-14H5v14z"></path><path d="M22 20h-3"></path><path d="M8 12h.01"></path></svg>
                <span className="property-label">Boarding</span>
              </div>
            </div>

            <div className="auth-buttons">
              <a href="/login" className="btn btn-login">
                Log In
              </a>
              <a href="/register" className="btn btn-register group">
                Register
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </a>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}