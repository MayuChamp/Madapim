import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Play, Settings, Bell, ChevronLeft, ChevronRight, Activity, Layout, Eye, MessageSquare, GripVertical } from 'lucide-react';
import './PresentationEvaluator.css';

const MOCK_DATA = [
  { subject: 'Coherence', A: 8.5, fullMark: 10 },
  { subject: 'Signaling', A: 7.5, fullMark: 10 },
  { subject: 'Spatial Contiguity', A: 8.0, fullMark: 10 },
  { subject: 'Redundancy', A: 6.8, fullMark: 10 },
  { subject: 'Segmenting', A: 8.2, fullMark: 10 },
  { subject: 'Modality', A: 7.2, fullMark: 10 },
];

export default function PresentationEvaluator() {
  const [scores, setScores] = useState({
    coherence: 8.5,
    signaling: 7.5,
    spatial: 8.0,
    redundancy: 6.8,
    segmenting: 8.2,
    modality: 7.2
  });

  const handleScoreChange = (key, value) => {
    setScores(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  const chartData = [
    { subject: 'Coherence', A: scores.coherence, fullMark: 10 },
    { subject: 'Signaling', A: scores.signaling, fullMark: 10 },
    { subject: 'Spatial', A: scores.spatial, fullMark: 10 },
    { subject: 'Redundancy', A: scores.redundancy, fullMark: 10 },
    { subject: 'Segmenting', A: scores.segmenting, fullMark: 10 },
    { subject: 'Modality', A: scores.modality, fullMark: 10 },
  ];

  return (
    <div className="evaluator-container">
      <header className="evaluator-header">
        <h1><Activity size={24} color="#66fcf1" /> EVALUATE.AI</h1>
        <div style={{ display: 'flex', gap: '2rem', color: '#c5c6c7', fontSize: '0.9rem' }}>
          <span style={{ color: '#fff', borderBottom: '2px solid #66fcf1', paddingBottom: '4px' }}>DASHBOARD</span>
          <span>PRESENTATIONS</span>
          <span>REPORTS</span>
          <span>SETTINGS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Bell size={20} />
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#45a29e' }}></div>
        </div>
      </header>

      <div className="evaluator-grid">
        {/* Left Sidebar */}
        <div className="sidebar-left">
          <div className="glass-panel">
            <h2 className="panel-title">Presentation Info</h2>
            <div style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Innovation Pitch</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Presenter: Dr. Anya Sharma</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Date: Oct 26, 2023</div>
            <div style={{ marginTop: '1rem', background: 'rgba(102, 252, 241, 0.1)', color: '#66fcf1', display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem' }}>ACTIVE EVALUATION</div>
          </div>

          <div className="glass-panel">
            <h2 className="panel-title">Principle Breakdown</h2>
            <div className="radar-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid stroke="rgba(255,255,255,0.2)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#c5c6c7', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="A" stroke="#66fcf1" fill="#66fcf1" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontSize: '0.9rem' }}>Transforming Education | Slide 4</span>
              <Settings size={16} color="rgba(255,255,255,0.5)" />
            </div>
            <div className="video-container">
              <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" alt="Presentation" />
              <div className="play-button">
                <Play size={24} fill="currentColor" />
              </div>
            </div>
            <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.5)' }}>
              <Play size={16} color="#fff" />
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '45%', background: '#66fcf1', borderRadius: '2px' }}></div>
                <div style={{ position: 'absolute', left: '45%', top: '50%', transform: 'translateY(-50%)', width: '10px', height: '10px', background: '#fff', borderRadius: '50%' }}></div>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#fff' }}>04:32 / 12:45</span>
            </div>
          </div>

          <div className="glass-panel">
            <h2 className="panel-title">Slides</h2>
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ minWidth: '150px', height: '80px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', border: i === 2 ? '2px solid #66fcf1' : '1px solid rgba(255,255,255,0.1)' }}></div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="sidebar-right">
          <div className="glass-panel">
            <h2 className="panel-title">Live Scoring</h2>
            {[
              { id: 'coherence', label: 'Coherence' },
              { id: 'signaling', label: 'Signaling' },
              { id: 'spatial', label: 'Spatial Contiguity' },
              { id: 'redundancy', label: 'Redundancy' },
              { id: 'segmenting', label: 'Segmenting' },
              { id: 'modality', label: 'Modality' },
            ].map(item => (
              <div className="slider-group" key={item.id}>
                <div className="slider-header">
                  <span>{item.label}</span>
                  <span style={{ color: '#66fcf1' }}>{scores[item.id].toFixed(1)}/10</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="0.1" 
                  value={scores[item.id]} 
                  onChange={(e) => handleScoreChange(item.id, e.target.value)}
                  style={{
                    background: `linear-gradient(to right, #66fcf1 0%, #66fcf1 ${(scores[item.id] / 10) * 100}%, rgba(255,255,255,0.1) ${(scores[item.id] / 10) * 100}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
              </div>
            ))}
          </div>

          <div className="glass-panel">
            <h2 className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Feedback Panel</span>
              <MessageSquare size={16} />
            </h2>
            <div className="feedback-card purple">
              <div className="feedback-time">04:15 - Slide 3</div>
              <div className="feedback-text">Clarify Coherence: Visual hierarchy is unclear on this slide.</div>
            </div>
            <div className="feedback-card">
              <div className="feedback-time">08:22 - Slide 7</div>
              <div className="feedback-text">Improve Signaling: Key points need visual cues or highlights.</div>
            </div>
            <div className="feedback-card">
              <div className="feedback-time">09:01 - Slide 8</div>
              <div className="feedback-text">Spatial Contiguity OK: Labels aligned well with the chart.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
