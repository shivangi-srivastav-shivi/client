import React, { useEffect, useRef, useState } from 'react';
import { loader } from '@monaco-editor/react';
import UserPresence from './UserPresence';

function Editor({ roomId }) {
  const editorRef = useRef(null);
  const monacoInstanceRef = useRef(null);
  const wsRef = useRef(null);
  const [code, setCode] = useState('// Start coding here...');
  const [username] = useState(`User${Math.floor(Math.random() * 1000)}`);
  const [language, setLanguage] = useState('javascript');

  const supportedLanguages = ['javascript', 'html', 'css', 'json'];

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);

    const monaco = monacoInstanceRef.current;
    const oldModel = monaco.getModel();
    const newModel = monaco.editor.createModel(oldModel.getValue(), newLang);
    monaco.setModel(newModel);
  };

  const runCode = () => {
    try {
      if (language === 'javascript') {
        // eslint-disable-next-line no-eval
        const result = eval(code);
        alert(`✅ Output: ${result}`);
      } else {
        alert('⚠️ Only JavaScript execution is supported for now.');
      }
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  useEffect(() => {
    loader.config({
      paths: {
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs',
      },
    });

    loader.init().then((monaco) => {
      const instance = monaco.editor.create(editorRef.current, {
        value: code,
        language,
        theme: 'vs-dark',
        automaticLayout: true,
      });

      monacoInstanceRef.current = instance;

      const ws = new WebSocket('ws://localhost:5000');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Connected to WebSocket');
        ws.send(JSON.stringify({ type: 'join', roomId }));
        ws.send(JSON.stringify({ type: 'user-join', username }));
      };

      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.type === 'codeUpdate') {
          const model = instance.getModel();
          if (model && model.getValue() !== data.code) {
            model.setValue(data.code);
          }
        }
      };

      const model = instance.getModel();
      const subscription = model.onDidChangeContent(() => {
        const updatedCode = model.getValue();
        setCode(updatedCode);
        ws.send(JSON.stringify({ type: 'codeChange', code: updatedCode }));
      });

      return () => {
        ws.send(JSON.stringify({ type: 'user-leave', username }));
        ws.close();
        subscription.dispose();
        instance.dispose();
      };
    });
  }, [roomId, username]);

  return (
    <>
      {/* Top toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px',
        backgroundColor: '#222',
        color: '#fff'
      }}>
        <span>👤 {username}</span>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={language}
            onChange={handleLanguageChange}
            style={{
              background: '#333',
              color: '#fff',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            {supportedLanguages.map(lang => (
              <option key={lang} value={lang}>{lang.toUpperCase()}</option>
            ))}
          </select>

          {language === 'javascript' && (
            <button
              onClick={runCode}
              style={{
                background: '#28a745',
                border: 'none',
                color: 'white',
                padding: '5px 12px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ▶️ Run JS
            </button>
          )}
        </div>
      </div>

      {/* Active Users shown below the Run Button */}
      <div style={{
        padding: '6px 10px',
        backgroundColor: '#111',
        color: '#ccc',
        fontSize: '14px'
      }}>
        <UserPresence ws={wsRef.current} username={username} />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        style={{
          height: '85vh',
          width: '100%',
          borderTop: '1px solid #444'
        }}
      />
    </>
  );
}

export default Editor;
