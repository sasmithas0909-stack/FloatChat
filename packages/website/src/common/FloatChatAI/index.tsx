import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ChatWindow from './ChatWindow';
import './FloatChatAI.css';

export default function FloatChatAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="floatchat-container">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          className="floatchat-fab"
          onClick={() => setIsOpen(true)}
          title="Ask FloatChat AI"
        >
          <span style={{ fontSize: '28px' }}>💬</span>
        </button>
      )}

      {/* Slide-Up Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`floatchat-window ${darkMode ? 'dark-mode' : ''}`}
          >
            <ChatWindow
              onClose={() => setIsOpen(false)}
              darkMode={darkMode}
              toggleDarkMode={() => setDarkMode(!darkMode)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
