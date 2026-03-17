'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface HealthInsights {
  healthScore: number;
  healthLabel: string;
  weightImpact: string;
  weightExplanation: string;
  muscleImpact: string;
  muscleExplanation: string;
  recommendations: string[];
  warnings: string[];
}

interface NutritionReport {
  items: FoodItem[];
  totals: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  healthInsights?: HealthInsights;
}

interface UserProfile {
  name: string;
  age: string;
  location: string;
  height: string;
  weight: string;
}

type AppState = 'idle' | 'camera' | 'preview' | 'loading' | 'result' | 'error';

export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<AppState>('idle');
  const [imageData, setImageData] = useState<string | null>(null);
  const [report, setReport] = useState<NutritionReport | null>(null);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bmi, setBmi] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('smartfuel_user');
    const bmiData = localStorage.getItem('smartfuel_bmi');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    if (bmiData) {
      setBmi(bmiData);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageData(event.target?.result as string);
        setState('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      setState('camera');

      // Wait for state update then set video
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Camera access denied:', err);
      setError('Unable to access camera. Please check permissions.');
      setState('error');
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setImageData(dataUrl);
      stopCamera();
      setState('preview');
    }
  };

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Cancel and go back
  const handleCancel = () => {
    stopCamera();
    setImageData(null);
    setReport(null);
    setError('');
    setState('idle');
  };

  // Analyze the image
  const analyzeImage = async () => {
    if (!imageData) return;

    setState('loading');
    setError('');

    try {
      // Include user profile for personalized insights
      const userProfile = user && bmi ? {
        name: user.name,
        age: user.age,
        height: user.height,
        weight: user.weight,
        bmi: bmi
      } : null;

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData, userProfile }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze image');
      }

      setReport(data);
      setState('result');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
      setState('error');
    }
  };

  // Render Camera View
  if (state === 'camera') {
    return (
      <div className="camera-modal">
        <div className="camera-header">
          <button className="btn btn-secondary" onClick={handleCancel}>
            ✕ Cancel
          </button>
          <span style={{ color: 'var(--text-secondary)' }}>Take a photo</span>
          <div style={{ width: 80 }}></div>
        </div>
        <div className="camera-preview">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div className="camera-controls">
          <button className="capture-btn" onClick={capturePhoto} aria-label="Capture photo" />
        </div>
      </div>
    );
  }

  return (
    <main className="container">
      {/* Header */}
      <header className="header">
        <div className="logo">🍽️</div>
        <h1 className="title">SmartFuel</h1>
        <p className="subtitle">AI-Powered Nutrition Analysis</p>
      </header>

      {/* User Badge or Register CTA */}
      {user ? (
        <div className="user-badge" onClick={() => router.push('/register')}>
          <div className="user-avatar">👤</div>
          <div className="user-info">
            <p className="user-name">{user.name}</p>
            <p className="user-stats">{user.height}cm • {user.weight}kg</p>
          </div>
          {bmi && (
            <div className="user-bmi">
              <p className="user-bmi-value">{bmi}</p>
              <p className="user-bmi-label">BMI</p>
            </div>
          )}
        </div>
      ) : (
        <div
          className="user-badge"
          onClick={() => router.push('/register')}
          style={{ justifyContent: 'center' }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>
            👤 Create your profile for personalized insights →
          </span>
        </div>
      )}

      {/* Idle State - Image Input */}
      {state === 'idle' && (
        <div className="card">
          <h2 className="card-title">📸 Capture Your Meal</h2>

          <div
            className="image-input-area"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-icon">📷</div>
            <p className="upload-text">Tap to upload or take a photo</p>
            <p className="upload-hint">Supports JPG, PNG, WEBP</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden-input"
          />

          <div className="btn-group" style={{ marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={startCamera}>
              📷 Camera
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              📁 Upload
            </button>
          </div>
        </div>
      )}

      {/* Preview State */}
      {state === 'preview' && imageData && (
        <>
          <div className="card">
            <h2 className="card-title">📸 Preview</h2>
            <div className="image-preview">
              <img src={imageData} alt="Food preview" />
            </div>
            <div className="btn-group" style={{ marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={handleCancel}>
                ✕ Cancel
              </button>
              <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                🔄 Change
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden-input"
            />
          </div>

          <div className="analyze-section">
            <button className="btn btn-primary btn-analyze" onClick={analyzeImage}>
              ✨ Analyze Nutrition
            </button>
          </div>
        </>
      )}

      {/* Loading State */}
      {state === 'loading' && (
        <div className="card">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p className="loading-text">Analyzing your meal...</p>
            <p className="loading-subtext">Identifying food items and calculating nutrition</p>
          </div>
        </div>
      )}

      {/* Result State */}
      {state === 'result' && report && (
        <div className="report">
          {/* Preview */}
          {imageData && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <img src={imageData} alt="Analyzed meal" style={{ width: '100%', display: 'block' }} />
            </div>
          )}

          {/* Food Items */}
          <div className="card">
            <div className="report-header">
              <span className="report-icon">🍴</span>
              <h2 className="report-title">Food Items</h2>
            </div>
            <div className="food-items">
              {report.items.map((item, index) => (
                <div key={index} className="food-item">
                  <div className="food-info">
                    <p className="food-name">{item.name}</p>
                    <p className="food-portion">{item.portion}</p>
                  </div>
                  <p className="food-calories">{item.calories} cal</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="card">
            <div className="totals">
              <p className="totals-title">Nutrition Summary</p>
              <div className="totals-grid">
                <div className="total-item">
                  <p className="total-value calories">
                    {report.totals.calories}
                    <span className="total-unit"> cal</span>
                  </p>
                  <p className="total-label">Calories</p>
                </div>
                <div className="total-item">
                  <p className="total-value protein">
                    {report.totals.protein}
                    <span className="total-unit">g</span>
                  </p>
                  <p className="total-label">Protein</p>
                </div>
                <div className="total-item">
                  <p className="total-value fat">
                    {report.totals.fat}
                    <span className="total-unit">g</span>
                  </p>
                  <p className="total-label">Fat</p>
                </div>
                <div className="total-item">
                  <p className="total-value carbs">
                    {report.totals.carbs}
                    <span className="total-unit">g</span>
                  </p>
                  <p className="total-label">Carbs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personalized Health Insights */}
          {report.healthInsights && (
            <div className="card insights-card">
              <div className="report-header">
                <span className="report-icon">💡</span>
                <h2 className="report-title">Personalized Insights</h2>
              </div>

              {/* Health Score */}
              <div className="health-score-section">
                <div className="health-score-circle" data-score={report.healthInsights.healthScore}>
                  <span className="health-score-value">{report.healthInsights.healthScore}</span>
                  <span className="health-score-max">/10</span>
                </div>
                <p className="health-score-label">{report.healthInsights.healthLabel}</p>
              </div>

              {/* Impact Cards */}
              <div className="impact-grid">
                <div className="impact-card">
                  <div className="impact-header">
                    <span className="impact-icon">⚖️</span>
                    <span className="impact-title">Weight Impact</span>
                  </div>
                  <p className={`impact-value ${report.healthInsights.weightImpact}`}>
                    {report.healthInsights.weightImpact === 'gain' && '📈 Weight Gain'}
                    {report.healthInsights.weightImpact === 'loss' && '📉 Weight Loss'}
                    {report.healthInsights.weightImpact === 'maintenance' && '⚖️ Maintenance'}
                  </p>
                  <p className="impact-explanation">{report.healthInsights.weightExplanation}</p>
                </div>

                <div className="impact-card">
                  <div className="impact-header">
                    <span className="impact-icon">💪</span>
                    <span className="impact-title">Muscle Impact</span>
                  </div>
                  <p className={`impact-value ${report.healthInsights.muscleImpact}`}>
                    {report.healthInsights.muscleImpact === 'gain' && '📈 Muscle Gain'}
                    {report.healthInsights.muscleImpact === 'loss' && '📉 Muscle Loss'}
                    {report.healthInsights.muscleImpact === 'maintenance' && '✊ Maintenance'}
                  </p>
                  <p className="impact-explanation">{report.healthInsights.muscleExplanation}</p>
                </div>
              </div>

              {/* Recommendations */}
              {report.healthInsights.recommendations.length > 0 && (
                <div className="recommendations-section">
                  <h3 className="section-subtitle">💡 Recommendations</h3>
                  <ul className="recommendations-list">
                    {report.healthInsights.recommendations.map((rec, index) => (
                      <li key={index} className="recommendation-item">
                        <span className="rec-bullet">✓</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {report.healthInsights.warnings && report.healthInsights.warnings.length > 0 && (
                <div className="warnings-section">
                  <h3 className="section-subtitle">⚠️ Health Alerts</h3>
                  <ul className="warnings-list">
                    {report.healthInsights.warnings.map((warning, index) => (
                      <li key={index} className="warning-item">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* CTA to register if no user */}
          {!user && (
            <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                👤 Create a profile to get personalized health insights!
              </p>
              <button
                className="btn btn-secondary"
                onClick={() => router.push('/register')}
              >
                Create Profile
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="btn btn-primary" onClick={handleCancel}>
              🔄 Analyze Another
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <div className="card">
          <div className="error">
            <div className="error-icon">⚠️</div>
            <p className="error-text">{error}</p>
            <button className="btn btn-secondary" onClick={handleCancel}>
              Try Again
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
