import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Build Your Profile',
      description:
        'Create a professional profile that highlights your bio, skills, and experience in a clean and discoverable format.'
    },
    {
      title: 'Grow Your Network',
      description:
        'Search for professionals, send connection requests, and manage your incoming and outgoing network activity.'
    },
    {
      title: 'Start Conversations',
      description:
        'Message your connections, keep track of conversations, and stay engaged with your professional community.'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Create an account',
      description:
        'Register in seconds and get your workspace ready with a default profile you can personalize anytime.'
    },
    {
      number: '02',
      title: 'Complete your profile',
      description:
        'Add your story, skills, and experience so others can understand your professional background.'
    },
    {
      number: '03',
      title: 'Connect and collaborate',
      description:
        'Discover users, grow your network, and start meaningful conversations from one organized platform.'
    }
  ];

  return (
    <div className="landing-page">
      <header className="landing-navbar">
        <div className="landing-brand">
          <div className="landing-brand-mark">PN</div>
          <div>
            <h1>ProNet</h1>
            <p>Professional Networking Platform</p>
          </div>
        </div>

        <div className="landing-nav-actions">
          <button
            type="button"
            className="landing-login-btn"
            onClick={() => navigate('/login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className="landing-register-btn"
            onClick={() => navigate('/register')}
          >
            Create Account
          </button>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-content">
            <p className="landing-eyebrow">Connect. Present. Grow.</p>
            <h2>Build professional connections with confidence.</h2>
            <p className="landing-hero-text">
              ProNet helps you create a strong profile, discover people in your field,
              manage connection requests, and communicate in one modern workspace.
            </p>

            <div className="landing-hero-actions">
              <button
                type="button"
                className="landing-primary-btn"
                onClick={() => navigate('/register')}
              >
                Get Started
              </button>
              <button
                type="button"
                className="landing-secondary-btn"
                onClick={() => navigate('/login')}
              >
                I already have an account
              </button>
            </div>

            <div className="landing-stats">
              <div className="landing-stat-card">
                <strong>Profiles</strong>
                <span>Showcase your skills and experience</span>
              </div>
              <div className="landing-stat-card">
                <strong>Connections</strong>
                <span>Expand your professional network</span>
              </div>
              <div className="landing-stat-card">
                <strong>Messages</strong>
                <span>Keep conversations organized</span>
              </div>
            </div>
          </div>

          <div className="landing-hero-panel">
            <div className="landing-panel-card main">
              <span className="landing-panel-tag">Smart Networking</span>
              <h3>Your professional space, all in one place.</h3>
              <p>
                Manage your identity, your connections, and your conversations with a
                simple, polished experience.
              </p>
            </div>

            <div className="landing-panel-grid">
              <div className="landing-panel-card small">
                <h4>Search Users</h4>
                <p>Discover people by skills, experience, and profile details.</p>
              </div>
              <div className="landing-panel-card small">
                <h4>Connection Requests</h4>
                <p>Review incoming and outgoing requests with clear status tracking.</p>
              </div>
              <div className="landing-panel-card small">
                <h4>Direct Messaging</h4>
                <p>Start conversations and stay connected with your network.</p>
              </div>
              <div className="landing-panel-card small">
                <h4>Profile View</h4>
                <p>Let others understand your professional story at a glance.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-features">
          <div className="landing-section-heading">
            <p className="landing-section-eyebrow">Why use ProNet</p>
            <h3>Everything you need to build a stronger professional presence</h3>
          </div>

          <div className="landing-feature-grid">
            {features.map((feature) => (
              <div key={feature.title} className="landing-feature-card">
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-steps">
          <div className="landing-section-heading centered">
            <p className="landing-section-eyebrow">How it works</p>
            <h3>Get started in three simple steps</h3>
          </div>

          <div className="landing-steps-grid">
            {steps.map((step) => (
              <div key={step.number} className="landing-step-card">
                <span className="landing-step-number">{step.number}</span>
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-cta-card">
            <div>
              <p className="landing-section-eyebrow">Ready to begin?</p>
              <h3>Join the platform and start building your network today.</h3>
            </div>

            <div className="landing-cta-actions">
              <button
                type="button"
                className="landing-primary-btn"
                onClick={() => navigate('/register')}
              >
                Create Your Account
              </button>
              <button
                type="button"
                className="landing-secondary-btn dark"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;