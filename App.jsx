import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './HomePage';
import NameInputPage from './NameInputPage';
import InterviewPage from './InterviewPage';
import EmailInputPage from './EmailInputPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/name" element={<NameInputPage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/email-input" element={<EmailInputPage />} />
      </Routes>
    </Router>
  );
}

export default App;
