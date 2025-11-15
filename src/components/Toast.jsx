import { useEffect, useState } from 'react';
import '../styles/components/Toast.css';

export default function Toast() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setMessages([]);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="toast">
      {messages.map((message) => (
        <div key={message.id} className={`toast__item toast__item--${message.type || 'info'}`}>
          <strong className="toast__title">{message.title}</strong>
          {message.description && <p className="toast__description">{message.description}</p>}
        </div>
      ))}
    </div>
  );
}
