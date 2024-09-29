import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function NameInputPage() {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleNext = () => {
    navigate('/interview', { state: { name } });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Enter your name</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border border-gray-300 rounded-lg py-2 px-4 mb-4 focus:ring-2 focus:ring-blue-500"
        placeholder="Enter your name"
      />
      <button
        className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
        onClick={handleNext}
      >
        Begin
      </button>
    </div>
  );
}

export default NameInputPage;
