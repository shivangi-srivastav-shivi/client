import React, { useEffect, useState } from 'react';

function UserPresence({ ws, username }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!ws) return;

    // Notify others that a user joined
    ws.send(JSON.stringify({ type: 'user-join', username }));

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      
      if (data.type === 'user-list') {
        setUsers(data.users);
      }
    };

    // Cleanup when unmount
    return () => {
      ws.send(JSON.stringify({ type: 'user-leave', username }));
    };
  }, [ws, username]);

  return (
    <div style={styles.container}>
      <h3>👥 Active Users:</h3>
      <ul>
        {users.map((user, idx) => (
          <li key={idx}>✅ {user}</li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  container: {
    textAlign: 'left',
    padding: '1rem',
    background: '#2d2d2d',
    color: '#fff',
    borderRadius: '8px',
    width: '200px',
    position: 'absolute',
    right: '20px',
    top: '20px',
  },
};

export default UserPresence;
