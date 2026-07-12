import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Custom Map Marker Icons
const floatIcon = L.divIcon({
  className: 'custom-float-marker',
  html: `<div style="background-color: #168dbd; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const buoyIcon = L.divIcon({
  className: 'custom-buoy-marker',
  html: `<div style="background-color: #f78c21; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const stationIcon = L.divIcon({
  className: 'custom-station-marker',
  html: `<div style="background-color: #37a692; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

interface FloatDataRow {
  floatId: string;
  latitude: number;
  longitude: number;
  temperature: number;
  salinity: number;
  pressure: number;
  depth: number;
  chlorophyll: number;
  oxygen: number;
  date: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  activeComponents?: {
    cards: boolean;
    map: boolean;
    charts: boolean;
    table: boolean;
    downloads: boolean;
    comparisonTable: boolean;
  };
  cards?: Record<string, any>;
  mapData?: any[];
  chartData?: any[];
  tableData?: FloatDataRow[];
  downloads?: Record<string, any>;
  comparisonData?: {
    headers: string[];
    rows: string[][];
  };
  meta?: {
    zoom: number;
    center: [number, number];
    chartMetric: string;
    confidenceLevel?: string;
  };
  suggestedQuestions?: string[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

interface ChatWindowProps {
  onClose: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const getApiBaseUrl = () => {
  const chatUrl = process.env.REACT_APP_CHAT_API_URL;
  if (chatUrl) {
    if (chatUrl.endsWith('/api')) {
      return chatUrl.substring(0, chatUrl.length - 4);
    }
    if (chatUrl.endsWith('/api/')) {
      return chatUrl.substring(0, chatUrl.length - 5);
    }
    return chatUrl;
  }
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

const SUGGESTED_QUESTIONS = [
  "Today's ocean summary",
  "Show floats near India",
  "Sea Surface Temperature",
  "Ocean Health",
  "Salinity",
  "Chlorophyll",
  "Dissolved Oxygen",
  "Forecast",
  "Download CSV",
  "Compare India vs Australia",
  "Where is Float 5906831?"
];

// Helper sub-component to update leaflet map view dynamically
function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// 1. Modular Ocean Health Cards component
function OceanHealthCards({ cards }: { cards: Record<string, any> }) {
  return (
    <div className="fc-cards-grid">
      <div className="fc-card">
        <div className="fc-card-label">Ocean Score</div>
        <div className="fc-card-value">{cards.oceanHealthScore}/100</div>
      </div>
      <div className="fc-card">
        <div className="fc-card-label">Active Floats</div>
        <div className="fc-card-value">{cards.activeFloats}</div>
      </div>
      <div className="fc-card">
        <div className="fc-card-label">Avg Temp</div>
        <div className="fc-card-value">{cards.temperature}</div>
      </div>
      <div className="fc-card">
        <div className="fc-card-label">Avg Salinity</div>
        <div className="fc-card-value">{cards.salinity}</div>
      </div>
      <div className="fc-card">
        <div className="fc-card-label">Avg Chlorophyll</div>
        <div className="fc-card-value">{cards.chlorophyll}</div>
      </div>
      <div className="fc-card">
        <div className="fc-card-label">Avg Oxygen</div>
        <div className="fc-card-value">{cards.oxygen}</div>
      </div>
      <div className="fc-card">
        <div className="fc-card-label">Wave Height</div>
        <div className="fc-card-value">{cards.waveHeight}</div>
      </div>
      <div className="fc-card">
        <div className="fc-card-label">Wind Speed</div>
        <div className="fc-card-value">{cards.windSpeed}</div>
      </div>
      <div className="fc-card">
        <div className="fc-card-label">Pressure</div>
        <div className="fc-card-value">{cards.pressure}</div>
      </div>
    </div>
  );
}

// 2. Modular Leaflet Map component
function InteractiveMap({ mapData, center, zoom }: { mapData: any[]; center: [number, number]; zoom: number }) {
  return (
    <div className="fc-map-container" style={{ position: 'relative', zIndex: 1 }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeMapView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mapData.map((item) => (
          <Marker
            key={item.id}
            position={[item.lat, item.lng]}
            icon={item.type === 'buoy' ? buoyIcon : item.type === 'station' ? stationIcon : floatIcon}
          >
            <Popup>
              <div style={{ fontSize: '11px', color: '#2f2f2f' }}>
                <strong>{item.name}</strong><br />
                Float ID: {item.id}<br />
                Latitude: {item.lat.toFixed(4)}<br />
                Longitude: {item.lng.toFixed(4)}<br />
                Temperature: {item.temperature} °C<br />
                Salinity: {item.salinity} PSU<br />
                Pressure: {item.pressure} dbar<br />
                Timestamp: {item.timestamp}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// 3. Modular Recharts Trend Chart component
function TrendCharts({ chartData, metric, chartId, onDownload }: { chartData: any[]; metric: string; chartId: string; onDownload: () => void }) {
  const isTemp = metric === 'temperature';
  const isSal = metric === 'salinity';
  const isChlor = metric === 'chlorophyll';
  const isOx = metric === 'oxygen';
  const isAll = metric === 'all';

  return (
    <div className="fc-chart-container" id={chartId}>
      <div className="fc-chart-header">
        <span className="fc-chart-title">
          {isTemp && "Water Temperature Trend (°C)"}
          {isSal && "Ocean Salinity Trend (PSU)"}
          {isChlor && "Chlorophyll Trend (mg/m³)"}
          {isOx && "Dissolved Oxygen Trend (mL/L)"}
          {isAll && "Averages: Temperature & Salinity Trends"}
        </span>
        <button className="fc-chart-download" onClick={onDownload}>
          Download PNG
        </button>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} />
          
          {isTemp && <YAxis tick={{ fontSize: 9 }} label={{ value: '°C', angle: -90, position: 'insideLeft', fontSize: 9 }} />}
          {isSal && <YAxis tick={{ fontSize: 9 }} label={{ value: 'PSU', angle: -90, position: 'insideLeft', fontSize: 9 }} />}
          {isChlor && <YAxis tick={{ fontSize: 9 }} label={{ value: 'mg/m³', angle: -90, position: 'insideLeft', fontSize: 9 }} />}
          {isOx && <YAxis tick={{ fontSize: 9 }} label={{ value: 'mL/L', angle: -90, position: 'insideLeft', fontSize: 9 }} />}
          {isAll && (
            <>
              <YAxis yAxisId="left" tick={{ fontSize: 9 }} label={{ value: '°C', angle: -90, position: 'insideLeft', fontSize: 9 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} label={{ value: 'PSU', angle: 90, position: 'insideRight', fontSize: 9 }} />
            </>
          )}

          <Tooltip wrapperStyle={{ fontSize: 9 }} />
          <Legend wrapperStyle={{ fontSize: 9 }} />

          {isTemp && <Line type="monotone" dataKey="temperature" stroke="#ff7675" name="Temp (°C)" strokeWidth={1.5} />}
          {isSal && <Line type="monotone" dataKey="salinity" stroke="#0984e3" name="Salinity (PSU)" strokeWidth={1.5} />}
          {isChlor && <Line type="monotone" dataKey="chlorophyll" stroke="#2ed573" name="Chlorophyll" strokeWidth={1.5} />}
          {isOx && <Line type="monotone" dataKey="oxygen" stroke="#1e90ff" name="Oxygen (mL/L)" strokeWidth={1.5} />}
          {isAll && (
            <>
              <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ff7675" name="Temp (°C)" strokeWidth={1.5} />
              <Line yAxisId="right" type="monotone" dataKey="salinity" stroke="#0984e3" name="Salinity (PSU)" strokeWidth={1.5} />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// 4. Modular Data Table component
function TelemetryTable({ tableData }: { tableData: FloatDataRow[] }) {
  const [tableSearch, setTableSearch] = useState('');
  const [sortField, setSortField] = useState<keyof FloatDataRow>('date');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const filtered = tableData.filter(row =>
    row.floatId.includes(tableSearch) || row.date.includes(tableSearch)
  );

  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / rowsPerPage);
  const paginated = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="fc-table-container">
      <div style={{ padding: '6px 8px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #dcdde1', alignItems: 'center' }}>
        <strong style={{ fontSize: '10px' }}>Telemetry Telemetric Logs</strong>
        <input
          type="text"
          className="fc-table-search"
          placeholder="Search..."
          value={tableSearch}
          onChange={(e) => {
            setTableSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>
      <table className="fc-table">
        <thead>
          <tr>
            <th style={{ cursor: 'pointer' }} onClick={() => { setSortField('floatId'); setSortAsc(!sortAsc); }}>Float ID</th>
            <th style={{ cursor: 'pointer' }} onClick={() => { setSortField('temperature'); setSortAsc(!sortAsc); }}>Temp (°C)</th>
            <th style={{ cursor: 'pointer' }} onClick={() => { setSortField('salinity'); setSortAsc(!sortAsc); }}>Salinity (PSU)</th>
            <th style={{ cursor: 'pointer' }} onClick={() => { setSortField('oxygen'); setSortAsc(!sortAsc); }}>Oxygen</th>
            <th style={{ cursor: 'pointer' }} onClick={() => { setSortField('date'); setSortAsc(!sortAsc); }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((row, idx) => (
            <tr key={`${row.floatId}-${row.date}-${idx}`}>
              <td>{row.floatId}</td>
              <td>{row.temperature}</td>
              <td>{row.salinity}</td>
              <td>{row.oxygen}</td>
              <td>{row.date}</td>
            </tr>
          ))}
          {paginated.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '12px' }}>No rows matching query</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="fc-table-controls">
        <span>Page {currentPage} of {totalPages || 1}</span>
        <div>
          <button
            className="fc-table-page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            Prev
          </button>
          <button
            className="fc-table-page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// 5. Modular Comparison Table component
function ComparisonTable({ comparisonData }: { comparisonData: { headers: string[]; rows: string[][] } }) {
  return (
    <div className="fc-table-container" style={{ margin: '16px 0' }}>
      <div style={{ padding: '6px 8px', borderBottom: '1px solid #dcdde1' }}>
        <strong style={{ fontSize: '10px' }}>Regional Comparisons: India vs Australia</strong>
      </div>
      <table className="fc-table">
        <thead>
          <tr>
            {comparisonData.headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparisonData.rows.map((row, i) => (
            <tr key={i}>
              <td><strong>{row[0]}</strong></td>
              <td>{row[1]}</td>
              <td>{row[2]}</td>
              <td style={{ color: row[3].includes('+') ? '#2ed573' : '#ff7675' }}>{row[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 6. Modular Export/Downloads panel
function ExportPanel({ onCsv, onJson, onPrint }: { onCsv: () => void; onJson: () => void; onPrint: () => void }) {
  return (
    <div className="fc-export-container">
      <button className="fc-export-btn" onClick={onCsv}>
        📥 Download CSV
      </button>
      <button className="fc-export-btn" onClick={onCsv}>
        📥 Download Excel
      </button>
      <button className="fc-export-btn" onClick={onJson}>
        📥 Download JSON
      </button>
      <button className="fc-export-btn" onClick={onPrint}>
        📥 Save PDF / Print
      </button>
    </div>
  );
}

export default function ChatWindow({ onClose, darkMode, toggleDarkMode }: ChatWindowProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedConvs = localStorage.getItem('floatchat-conversations');
    const savedActiveId = localStorage.getItem('floatchat-active-id');

    if (savedConvs) {
      try {
        const parsed = JSON.parse(savedConvs);
        if (parsed && parsed.length > 0) {
          setConversations(parsed);
          if (savedActiveId && parsed.some((c: any) => c.id === savedActiveId)) {
            setActiveId(savedActiveId);
          } else {
            setActiveId(parsed[0].id);
            localStorage.setItem('floatchat-active-id', parsed[0].id);
          }
          return;
        }
      } catch (e) {
        console.error("Failed to load local chat history", e);
      }
    }

    // Default first conversation
    const defaultId = `session-${Date.now()}`;
    const defaultConv: Conversation = {
      id: defaultId,
      title: 'Ocean Data Chat',
      createdAt: Date.now(),
      messages: [
        {
          id: 'greeting',
          sender: 'assistant',
          text: "🌊 Welcome to **FloatChat AI**! I am your oceanographic assistant. Ask me about ARGO floats, salinity levels near India, Sea Surface Temperatures, or download CSV data reports."
        }
      ]
    };
    setConversations([defaultConv]);
    setActiveId(defaultId);
    localStorage.setItem('floatchat-conversations', JSON.stringify([defaultConv]));
    localStorage.setItem('floatchat-active-id', defaultId);
  }, []);

  const activeConv = conversations.find(c => c.id === activeId) || conversations[0];
  const messages = activeConv ? activeConv.messages : [];

  // Scroll to bottom when messages or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const saveConversations = (list: Conversation[]) => {
    setConversations(list);
    localStorage.setItem('floatchat-conversations', JSON.stringify(list));
  };

  const selectConversation = (id: string) => {
    setActiveId(id);
    localStorage.setItem('floatchat-active-id', id);
  };

  const createNewConversation = () => {
    const newId = `session-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New Chat',
      createdAt: Date.now(),
      messages: [
        {
          id: 'greeting',
          sender: 'assistant',
          text: "🌊 Welcome to **FloatChat AI**! I am your oceanographic assistant. Ask me about ARGO floats, salinity levels near India, Sea Surface Temperatures, or download CSV data reports."
        }
      ]
    };
    const updated = [newConv, ...conversations];
    saveConversations(updated);
    selectConversation(newId);
    setSidebarOpen(false);
  };

  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const saveRename = (id: string) => {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }
    const updated = conversations.map(c =>
      c.id === id ? { ...c, title: editingTitle.trim() } : c
    );
    saveConversations(updated);
    setEditingId(null);
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (conversations.length <= 1) {
      alert("You must keep at least one conversation in history.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this chat session?")) {
      const updated = conversations.filter(c => c.id !== id);
      saveConversations(updated);
      if (activeId === id) {
        selectConversation(updated[0].id);
      }
    }
  };

  const updateActiveMessages = (updater: (prev: Message[]) => Message[], newTitle?: string) => {
    setConversations((prev) => {
      const nextList = prev.map((c) => {
        if (c.id === activeId) {
          return {
            ...c,
            title: newTitle || c.title,
            messages: updater(c.messages)
          };
        }
        return c;
      });
      localStorage.setItem('floatchat-conversations', JSON.stringify(nextList));
      return nextList;
    });
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text
    };

    setInputValue('');
    setIsTyping(true);

    // Auto rename if title is still "New Chat" and this is the first user query
    const currentActive = conversations.find(c => c.id === activeId);
    const hasUserMsgs = currentActive && currentActive.messages.some(m => m.sender === 'user');
    const autoTitle = (!hasUserMsgs && currentActive && currentActive.title === 'New Chat')
      ? (text.length > 25 ? text.substring(0, 25) + '...' : text)
      : undefined;

    updateActiveMessages((prev) => [...prev, userMessage], autoTitle);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversation_id: activeId
        })
      });

      if (!response.ok) {
        throw new Error("Backend server error");
      }

      const assistantMsgId = `assistant-${Date.now()}`;
      updateActiveMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          sender: 'assistant',
          text: ''
        }
      ]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let partialText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.type === 'chunk') {
                  partialText += data.text;
                  updateActiveMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, text: partialText }
                        : msg
                    )
                  );
                } else if (data.type === 'data') {
                  updateActiveMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? {
                            ...msg,
                            text: data.summary,
                            activeComponents: data.activeComponents,
                            cards: data.cards,
                            mapData: data.mapData,
                            chartData: data.chartData,
                            tableData: data.tableData,
                            downloads: data.downloads,
                            comparisonData: data.comparisonData,
                            meta: data.meta,
                            suggestedQuestions: data.suggestedQuestions
                          }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // Ignore parsing errors for partial chunks
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
      updateActiveMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Error**: Failed to connect to the backend server. Make sure the FastAPI backend is running on \`${API_BASE_URL}/api/chat\`.`
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setVoiceActive(true);
    recognition.onend = () => setVoiceActive(false);
    recognition.onerror = () => setVoiceActive(false);

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInputValue(speechToText);
    };

    recognition.start();
  };

  const getActiveTableData = (msg: Message): FloatDataRow[] => {
    return msg.tableData || [];
  };

  // Raw file downloads from complete mock databases
  const triggerCSVDownload = (tableData: FloatDataRow[]) => {
    const headers = "Float ID,Date,Latitude,Longitude,Temperature (°C),Salinity (PSU),Pressure (dbar),Depth (m),Chlorophyll (mg/m³),Oxygen (mL/L)\n";
    const rows = tableData.map(r =>
      `"${r.floatId}","${r.date}",${r.latitude},${r.longitude},${r.temperature},${r.salinity},${r.pressure},${r.depth},${r.chlorophyll},${r.oxygen}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ocean_data_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerJSONDownload = (tableData: FloatDataRow[]) => {
    const blob = new Blob([JSON.stringify(tableData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ocean_data_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPrintReport = (summary: string, tableData: FloatDataRow[]) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>FloatChat AI Report</title>
            <style>
              body { font-family: sans-serif; margin: 40px; color: #2d3436; }
              h1 { color: #168dbd; border-bottom: 2px solid #168dbd; padding-bottom: 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #dcdde1; padding: 8px 10px; font-size: 12px; }
              th { background-color: #f1f2f6; }
              .summary { line-height: 1.5; font-size: 13px; }
            </style>
          </head>
          <body>
            <h1>FloatChat AI Report</h1>
            <div class="summary">${summary.replace(/\n/g, '<br/>')}</div>
            <h2>Recorded Float Logs</h2>
            <table>
              <thead>
                <tr>
                  <th>Float ID</th>
                  <th>Date</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Temp (°C)</th>
                  <th>Salinity (PSU)</th>
                  <th>Pressure (dbar)</th>
                </tr>
              </thead>
              <tbody>
                ${tableData.map(r => `
                  <tr>
                    <td>${r.floatId}</td>
                    <td>${r.date}</td>
                    <td>${r.latitude}</td>
                    <td>${r.longitude}</td>
                    <td>${r.temperature}</td>
                    <td>${r.salinity}</td>
                    <td>${r.pressure}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const triggerChartDownloadPng = (chartId: string) => {
    const container = document.getElementById(chartId);
    const svg = container?.querySelector('svg');
    if (svg) {
      const svgString = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL_OBJ = window.URL || window.webkitURL || window;
      const blobURL = URL_OBJ.createObjectURL(svgBlob);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = svg.clientWidth || 500;
        canvas.height = svg.clientHeight || 200;
        const context = canvas.getContext('2d');
        if (context) {
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0);
          const png = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = png;
          downloadLink.download = `${chartId}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      };
      image.src = blobURL;
    }
  };

  // Find the last assistant message's suggested follow-ups
  const lastAssistantMsg = [...messages].reverse().find(m => m.sender === 'assistant');
  const activeSuggestedQuestions = (lastAssistantMsg && lastAssistantMsg.suggestedQuestions && lastAssistantMsg.suggestedQuestions.length > 0)
    ? lastAssistantMsg.suggestedQuestions
    : SUGGESTED_QUESTIONS;

  return (
    <div className={`floatchat-panel ${darkMode ? 'dark-mode' : ''}`} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 'inherit', position: 'relative' }}>
      
      {/* Collapsible Sidebar for Chat History */}
      <div className={`floatchat-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="floatchat-sidebar-header">
          <span>Conversations</span>
          <button type="button" className="floatchat-sidebar-close" onClick={() => setSidebarOpen(false)}>×</button>
        </div>
        
        <button type="button" className="floatchat-new-chat-btn" onClick={createNewConversation}>
          ➕ New Chat
        </button>

        <div className="floatchat-conversations-list">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`floatchat-conv-item ${conv.id === activeId ? 'active' : ''}`}
              onClick={() => {
                selectConversation(conv.id);
                setSidebarOpen(false);
              }}
            >
              <div className="floatchat-conv-item-left">
                <span className="floatchat-conv-icon">💬</span>
                {editingId === conv.id ? (
                  <input
                    type="text"
                    className="floatchat-rename-input"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename(conv.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => saveRename(conv.id)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <span className="floatchat-conv-title" title={conv.title}>
                    {conv.title}
                  </span>
                )}
              </div>
              <div className="floatchat-conv-actions" onClick={(e) => e.stopPropagation()}>
                {editingId !== conv.id ? (
                  <>
                    <button
                      type="button"
                      className="floatchat-conv-action-btn"
                      onClick={() => startEditing(conv.id, conv.title)}
                      title="Rename Chat"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="floatchat-conv-action-btn"
                      onClick={(e) => deleteConversation(conv.id, e)}
                      title="Delete Chat"
                    >
                      🗑️
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="floatchat-header">
        <div className="floatchat-header-title">
          <button type="button" className="floatchat-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} title="Chat History">
            📜
          </button>
          <span>🌊</span> FloatChat AI
        </div>
        <div className="floatchat-header-actions">
          <button type="button" className="floatchat-header-btn" onClick={toggleDarkMode} title="Toggle Dark/Light Mode">
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button type="button" className="floatchat-header-btn" onClick={createNewConversation} title="New Chat">
            ➕
          </button>
          <button type="button" className="floatchat-header-btn" onClick={onClose} title="Close Chat">
            ❌
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="floatchat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`fc-message-wrapper ${msg.sender}`}>
            <div className="fc-message-bubble">
              <ReactMarkdown>{msg.text}</ReactMarkdown>

              {/* Render dynamic components strictly based on intent response rules */}
              {msg.activeComponents?.cards && msg.cards && Object.keys(msg.cards).length > 0 && (
                <OceanHealthCards cards={msg.cards} />
              )}

              {msg.activeComponents?.map && msg.mapData && msg.mapData.length > 0 && (
                <InteractiveMap
                  mapData={msg.mapData}
                  center={msg.meta?.center || [0.0, 110.0]}
                  zoom={msg.meta?.zoom || 2}
                />
              )}

              {msg.activeComponents?.charts && msg.chartData && msg.chartData.length > 0 && (
                <TrendCharts
                  chartData={msg.chartData}
                  metric={msg.meta?.chartMetric || 'all'}
                  chartId={`chart-${msg.id}`}
                  onDownload={() => triggerChartDownloadPng(`chart-${msg.id}`)}
                />
              )}

              {msg.activeComponents?.table && msg.tableData && msg.tableData.length > 0 && (
                <TelemetryTable tableData={msg.tableData} />
              )}

              {msg.activeComponents?.comparisonTable && msg.comparisonData && (
                <ComparisonTable comparisonData={msg.comparisonData} />
              )}

              {msg.activeComponents?.downloads && (
                <ExportPanel
                  onCsv={() => triggerCSVDownload(getActiveTableData(msg))}
                  onJson={() => triggerJSONDownload(getActiveTableData(msg))}
                  onPrint={() => triggerPrintReport(msg.text, getActiveTableData(msg))}
                />
              )}
            </div>

            {/* General Actions */}
            {msg.sender === 'assistant' && (
              <div className="fc-message-actions">
                <button type="button" className="fc-action-link" onClick={() => copyToClipboard(msg.text)}>
                  📋 Copy response
                </button>
                <button type="button" className="fc-action-link" onClick={() => {
                  const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
                  if (lastUserMsg) {
                    handleSend(lastUserMsg.text);
                  }
                }}>
                  🔄 Regenerate
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Typing animation bubble */}
        {isTyping && (
          <div className="fc-message-wrapper assistant">
            <div className="fc-typing-bubble">
              <span className="fc-typing-dot"></span>
              <span className="fc-typing-dot"></span>
              <span className="fc-typing-dot"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      <div className="floatchat-quick-actions">
        {activeSuggestedQuestions.map((q) => (
          <button
            key={q}
            type="button"
            className="floatchat-suggest-btn"
            onClick={() => handleSend(q)}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input container */}
      <form
        className="floatchat-input-container"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputValue);
        }}
      >
        <button
          type="button"
          className={`floatchat-input-btn ${voiceActive ? 'voice-active' : ''}`}
          onClick={handleVoiceInput}
          title="Voice input"
        >
          🎙️
        </button>
        <input
          type="text"
          className="floatchat-input"
          placeholder="Ask FloatChat AI..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit" className="floatchat-input-btn" title="Send message">
          🚀
        </button>
      </form>
    </div>
  );
}
