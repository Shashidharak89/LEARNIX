"use client";

import { FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import "./styles/MessageDisplay.css";

export default function MessageDisplay({ message }) {
  if (!message) return null;

  const getMessageType = () => {
    if (message.includes('success')) return 'success';
    if (message.includes('error') || message.includes('Failed')) return 'error';
    if (message.includes('warning')) return 'warning';
    return '';
  };

  const getMessageIcon = () => {
    const type = getMessageType();
    if (type === 'success') return <FiCheckCircle className="mse-message-icon" />;
    if (type === 'error') return <FiAlertTriangle className="mse-message-icon" />;
    if (type === 'warning') return <FiAlertTriangle className="mse-message-icon" />;
    return null;
  };

  return (
    <div className={`mse-message ${getMessageType()}`}>
      {getMessageIcon()}
      {message}
    </div>
  );
}