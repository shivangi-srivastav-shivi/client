import React, { useState } from 'react';
import Editor from './Editor';
import './RoomManager.css'; // Optional for better styling

function RoomManager() {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState('');

  const handleJoin = () => {
    if (roomId.trim() !== '') {
      setJoined(true);
    } else {
      alert('❗ Please enter a valid Room ID');
    }
  };

  const handleGenerateRoom = () => {
    const newRoomId = `room-${Math.random().toString(36).substring(2, 8)}`;
    setRoomId(newRoomId);
  };

  return (
    <div className="room-manager">
      {joined ? (
        <Editor roomId={roomId} />
      ) : (
        <div className="room-join-container">
          <h2>🚀 Welcome to CodeSynergy</h2>
          <input
            type="text"
            placeholder="Enter or generate Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <div className="btn-group">
            <button onClick={handleGenerateRoom}>Generate Room</button>
            <button onClick={handleJoin}>Join Room</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomManager;
