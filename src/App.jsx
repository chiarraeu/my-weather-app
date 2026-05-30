import { useState, useEffect } from "react";
import { Home, Search, Clock, Sun, Sunrise, Sunset } from "lucide-react";

const API_BASE = "https://api.open-meteo.com/v1/forecast";

const WMO_CODES = {
  0: { label: "Ясно", icon: "☀️" },
  1: { label: "Предимно ясно", icon: "🌤️" },
  2: { label: "Частично облачно", icon: "⛅" },
  3: { label: "Облачно", icon: "☁️" },
  45: { label: "Мъгла", icon: "🌫️" },
  48: { label: "Скреж", icon: "🌫️" },
  51: { label: "Ситен дъжд", icon: "🌦️" },
  61: { label: "Дъжд", icon: "🌧️" },
  71: { label: "Сняг", icon: "❄️" },
  80: { label: "Дъждовни ливеди", icon: "🌦️" },
  95: { label: "Гръмотевична буря", icon: "⛈️" },
};

function getWeatherInfo(code) {
  return WMO_CODES[code] || { label: "Неизвестно", icon: "🌡️" };
}

const DAYS_BG = ["Нед", "Пон", "Вт", "Ср", "Чет", "Пет", "Съб"];
const MONTHS_BG = ["яну", "фев", "мар", "апр", "май", "юни", "юли", "авг", "сеп", "окт", "ное", "дек"];

function formatDay(dateStr) {
  const d = new Date(dateStr);
  return `${DAYS_BG[d.getDay()]} ${d.getDate()} ${MONTHS_BG[d.getMonth()]}`;
}

function WeatherIcon({ code, size = 48 }) {
  const info = getWeatherInfo(code);
  const hour = new Date().getHours();
  const isNight = hour >= 22 || hour < 5;
  const icon = isNight && [0, 1].includes(code)
    ? (code === 0 ? "🌕" : "🌙")
    : info.icon;
  return <span style={{ fontSize: size }}>{icon}</span>;
}

function TempBar({ min, max, globalMin, globalMax }) {
  const range = globalMax - globalMin || 1;
  const left = ((min - globalMin) / range) * 100;
  const width = ((max - min) / range) * 100;
  return (
    <div style={{ position: "relative", height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 99, flex: 1, margin: "0 8px" }}>
      <div style={{
        position: "absolute",
        left: `${left}%`,
        width: `${Math.max(width, 8)}%`,
        height: "100%",
        borderRadius: 99,
        background: "linear-gradient(90deg, #38bdf8, #f97316)",
      }} />
    </div>
  );
}

function getBackground(code) {
  if (code === 0) return "linear-gradient(135deg, #1e3c72, #2a5298)";
  if ([1, 2].includes(code)) return "linear-gradient(135deg, #3a7bd5, #00d2ff)";
  if (code === 3) return "linear-gradient(135deg, #232526, #414345)";
  if ([45, 48].includes(code)) return "linear-gradient(135deg, #757f9a, #d7dde8)";
  if ([51, 61, 80].includes(code)) return "linear-gradient(135deg, #373b44, #4286f4)";
  if ([71].includes(code)) return "linear-gradient(135deg, #83a4d4, #b6fbff)";
  if ([95].includes(code)) return "linear-gradient(135deg, #20002c, #cbb4d4)";
  return "linear-gradient(135deg, #0c1445, #26d0ce)";
}

function WeatherEffects({ code }) {
  if ([1, 2, 3].includes(code)) {
    return (
      <>
        <div className="cloud" style={{ top: "15%", left: "10%" }} />
        <div className="cloud" style={{ top: "30%", left: "60%", animationDelay: "3s" }} />
      </>
    );
  }
  if ([51, 61, 80].includes(code)) {
    return (
      <>
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="rain-drop"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${20 + Math.random() * 40}%`,
              animationDelay: `${Math.random()}s`,
            }}
          />
        ))}
      </>
    );
  }
  return null;
}

function TempChart({ hourly }) {
  const now = new Date().toISOString().slice(0, 10);
  const points = hourly.time
    .map((t, i) => ({ t, temp: hourly.temperature_2m[i] }))
    .filter(p => p.t.startsWith(now));

  const temps = points.map(p => p.temp);
  const min = Math.min(...temps) - 2;
  const max = Math.max(...temps) + 2;
  const w = 300, h = 80;

  const x = (i) => (i / (points.length - 1)) * w;
  const y = (t) => h - ((t - min) / (max - min)) * h;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.temp)}`).join(" ");

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${w} ${h + 24}`} style={{ width: "100%", display: "block" }}>
        <defs>
          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={path + ` L ${w} ${h} L 0 ${h} Z`} fill="url(#tempGrad)" />
        <path d={path} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.filter((_, i) => i % 3 === 0).map((p, i) => {
          const origI = i * 3;
          return (
            <g key={i}>
              <circle cx={x(origI)} cy={y(p.temp)} r="3" fill="#f97316" />
              <text x={x(origI)} y={y(p.temp) - 6} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">
                {Math.round(p.temp)}°
              </text>
              <text x={x(origI)} y={h + 16} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">
                {new Date(p.t).getHours()}:00
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function WeatherApp() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coords, setCoords] = useState(null);
  const [locationName, setLocationName] = useState("Определяне на местоположение...");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [hourlyData, setHourlyData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState("main");
  const [tab, setTab] = useState("home");

  function searchCity(q) {
    if (q.length < 2) return setSearchResults([]);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`)
      .then(r => r.json())
      .then(data => {
        setSearchResults(data.map(item => ({
          name: item.display_name,
          lat: item.lat,
          lon: item.lon,
        })));
      });
  }

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setCoords({ lat: 42.70, lon: 23.32 })
    );
    if (!navigator.geolocation) setCoords({ lat: 42.70, lon: 23.32 });
  }, []);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);

    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lon}&format=json`)
      .then(r => r.json())
      .then(d => {
        const city = d.address?.city || d.address?.town || d.address?.village || d.address?.county || "Неизвестно";
        const country = d.address?.country || "";
        setLocationName(`${city}, ${country}`);
      });

    fetch(`${API_BASE}?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,apparent_temperature,wind_speed_10m,weathercode&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,sunrise,sunset&hourly=temperature_2m&timezone=auto&forecast_days=10`)
      .then(r => r.json())
      .then(d => { setWeather(d); setLoading(false); })
      .catch(() => { setError("Грешка при зареждане"); setLoading(false); });
  }, [coords]);

  function loadHourly(date) {
    setSelectedDate(date);
    setView("hourly");
    fetch(`${API_BASE}?latitude=${coords.lat}&longitude=${coords.lon}&hourly=temperature_2m,precipitation,weathercode,wind_speed_10m&timezone=auto`)
      .then(r => r.json())
      .then(d => {
        const hours = d.hourly.time
          .map((t, i) => ({
            time: t,
            temp: d.hourly.temperature_2m[i],
            code: d.hourly.weathercode[i],
            rain: d.hourly.precipitation[i],
            wind: d.hourly.wind_speed_10m[i],
          }))
          .filter(h => h.time.startsWith(date));
        setHourlyData(hours);
      });
  }

  const styles = {
    app: {
      minHeight: "100vh",
      background: weather ? getBackground(weather.current.weathercode) : "#0c1445",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#fff",
      padding: "0",
      overflowX: "hidden",
      position: "relative",
      transition: "background 0.6s ease",
    },
    hero: {
      padding: "40px 24px 32px",
      textAlign: "center",
      position: "relative",
      zIndex: 2,
    },
    section: {
      margin: "0 12px 12px",
      background: "rgba(255,255,255,0.08)",
      backdropFilter: "blur(20px)",
      borderRadius: 20,
      padding: "16px 20px",
      border: "1px solid rgba(255,255,255,0.12)",
      position: "relative",
      zIndex: 2,
    },
    sectionTitle: {
      fontSize: 11,
      letterSpacing: 2,
      textTransform: "uppercase",
      opacity: 0.5,
      marginBottom: 16,
      fontWeight: 600,
    },
    dailyRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 0",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      cursor: "pointer",
    },
  };

  if (loading)
    return (
      <div style={{ ...styles.app, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 48 }}>⛅</div>
        <div style={{ opacity: 0.6, fontSize: 14, letterSpacing: 2, textTransform: "uppercase" }}>Зареждане...</div>
      </div>
    );

  if (error)
    return (
      <div style={{ ...styles.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ opacity: 0.6 }}>{error}</div>
      </div>
    );

  const cur = weather.current;
  const daily = weather.daily;
  const weatherInfo = getWeatherInfo(cur.weathercode);
  const globalMin = Math.min(...daily.temperature_2m_min);
  const globalMax = Math.max(...daily.temperature_2m_max);
  const now = new Date(cur.time);
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  return (
    <div style={styles.app}>
      <WeatherEffects code={cur.weathercode} />

      {/* MAIN VIEW */}
      {view === "main" && (
        <div>

          {/* SEARCH TAB */}
          {tab === "search" && (
            <div style={{ padding: "16px 0" }}>
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); searchCity(e.target.value); }}
                placeholder="Търси град..."
                style={{
                  width: "calc(100% - 24px)", margin: "0 12px", padding: "12px 16px",
                  borderRadius: 12, border: "none", outline: "none", fontSize: 16,
                  background: "rgba(255,255,255,0.15)", color: "#fff",
                  backdropFilter: "blur(10px)", boxSizing: "border-box",
                }}
              />
              {searchResults.length > 0 && (
                <div style={{ marginTop: 8, marginLeft: 12, marginRight: 12, background: "rgba(0,0,0,0.3)", borderRadius: 12, overflow: "hidden" }}>
                  {searchResults.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setCoords({ lat: parseFloat(c.lat), lon: parseFloat(c.lon) });
                        setLocationName(c.name);
                        setSearchResults([]);
                        setQuery("");
                        setTab("home");
                      }}
                      style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
                    >
                      {c.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HOME TAB — HERO */}
          {tab === "home" && (
            <div style={styles.hero}>
              <div style={{ fontSize: 13, letterSpacing: 3, opacity: 0.7, marginBottom: 20, lineHeight: 1.4 }}>
                📍 {locationName}
              </div>
              <div style={{ lineHeight: 1, marginBottom: 8 }}>
                <WeatherIcon code={cur.weathercode} size={64} />
              </div>
              <div style={{ fontSize: 96, fontWeight: 200, lineHeight: 1 }}>
                {Math.round(cur.temperature_2m)}
                <span style={{ fontSize: 40, fontWeight: 300 }}>°C</span>
              </div>
              <div style={{ fontSize: 20, opacity: 0.9 }}>{weatherInfo.label}</div>
              <div style={{ fontSize: 14, opacity: 0.55, marginTop: 4 }}>
                Усеща се като {Math.round(cur.apparent_temperature)}°C
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 24, opacity: 0.75, fontSize: 13 }}>
                <div style={{ textAlign: "center" }}>
                  💨 <div style={{ fontWeight: 600 }}>{cur.wind_speed_10m} km/h</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  ⬆️ <div style={{ fontWeight: 600 }}>{Math.round(daily.temperature_2m_max[0])}°</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  ⬇️ <div style={{ fontWeight: 600 }}>{Math.round(daily.temperature_2m_min[0])}°</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  🕐 <div style={{ fontWeight: 600 }}>{timeStr}</div>
                </div>
              </div>
            </div>
          )}

          {/* ИЗГРЕВ / ЗАЛЕЗ */}
          {tab === "home" && daily.sunrise && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Изгрев и залез</div>
              <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
                <div>
                  <Sunrise size={36} color="#f97316" />
                  <div style={{ fontSize: 22, fontWeight: 600, marginTop: 10 }}>
                    {new Date(daily.sunrise[0]).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>Изгрев</div>
                </div>
                <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", margin: "0 8px" }} />
                <div>
                  {(() => {
                    const rise = new Date(daily.sunrise[0]);
                    const set = new Date(daily.sunset[0]);
                    const diff = set - rise;
                    const h = Math.floor(diff / 3600000);
                    const m = Math.floor((diff % 3600000) / 60000);
                    return (
                      <>
                        <Sun size={36} color="#fbbf24" />
                        <div style={{ fontSize: 22, fontWeight: 600, marginTop: 10 }}>{h}ч {m}мин</div>
                        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>Дневна светлина</div>
                      </>
                    );
                  })()}
                </div>
                <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", margin: "0 8px" }} />
                <div>
                  <Sunset size={36} color="#f97316" />
                  <div style={{ fontSize: 22, fontWeight: 600, marginTop: 10 }}>
                    {new Date(daily.sunset[0]).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>Залез</div>
                </div>
              </div>
            </div>
          )}

          {/* ТЕМПЕРАТУРНА ГРАФИКА */}
          {tab === "home" && weather.hourly && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Температура днес</div>
              <TempChart hourly={weather.hourly} />
            </div>
          )}

          {/* 10-ДНЕВНА ПРОГНОЗА */}
          {tab === "home" && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>10-дневна прогноза</div>
              {daily.time.map((date, i) => (
                <div
                  key={date}
                  onClick={() => loadHourly(date)}
                  style={{ ...styles.dailyRow, borderBottom: i === daily.time.length - 1 ? "none" : undefined }}
                >
                  <span style={{ width: 48 }}>{i === 0 ? "Днес" : formatDay(date)}</span>
                  <WeatherIcon code={daily.weathercode[i]} size={20} />
                  <span style={{ width: 32, opacity: 0.6 }}>{Math.round(daily.temperature_2m_min[i])}°</span>
                  <TempBar min={daily.temperature_2m_min[i]} max={daily.temperature_2m_max[i]} globalMin={globalMin} globalMax={globalMax} />
                  <span style={{ width: 32, fontWeight: 600 }}>{Math.round(daily.temperature_2m_max[i])}°</span>
                  <span style={{ fontSize: 11, background: "rgba(56,189,248,0.25)", color: "#7dd3fc", borderRadius: 6, padding: "2px 6px", minWidth: 36, textAlign: "right" }}>
                    {daily.precipitation_sum[i].toFixed(1)}mm
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* HOURLY VIEW */}
      {view === "hourly" && hourlyData && (
        <div>
          <div style={{ padding: "16px 20px" }}>
            <button
              onClick={() => setView("main")}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 12, padding: "10px 16px", color: "#fff", fontSize: 14, cursor: "pointer", backdropFilter: "blur(10px)" }}
            >
              ← Назад
            </button>
          </div>
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Почасова прогноза — {formatDay(selectedDate)}</div>
            {hourlyData.map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ width: 50, opacity: 0.8 }}>{new Date(h.time).getHours().toString().padStart(2, "0")}:00</span>
                <WeatherIcon code={h.code} size={24} />
                <span style={{ width: 40, fontWeight: 600 }}>{Math.round(h.temp)}°</span>
                <span style={{ width: 50, opacity: 0.7 }}>💧 {h.rain.toFixed(1)}mm</span>
                <span style={{ width: 60, opacity: 0.7 }}>💨 {h.wind} km/h</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB BAR */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, width: "100%",
        background: "rgba(0,0,0,0.35)", backdropFilter: "blur(12px)",
        display: "flex", justifyContent: "space-around",
        padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.15)", zIndex: 10,
      }}>
        <div onClick={() => { setTab("home"); setView("main"); }} style={{ textAlign: "center", cursor: "pointer", opacity: tab === "home" ? 1 : 0.5 }}>
          <Home size={22} color="#fff" />
          <div style={{ fontSize: 11, marginTop: 4 }}>Начало</div>
        </div>
        <div onClick={() => { setTab("search"); setView("main"); }} style={{ textAlign: "center", cursor: "pointer", opacity: tab === "search" ? 1 : 0.5 }}>
          <Search size={22} color="#fff" />
          <div style={{ fontSize: 11, marginTop: 4 }}>Търсене</div>
        </div>
        <div onClick={() => setView("hourly")} style={{ textAlign: "center", cursor: "pointer", opacity: view === "hourly" ? 1 : 0.5 }}>
          <Clock size={22} color="#fff" />
          <div style={{ fontSize: 11, marginTop: 4 }}>Почасово</div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ textAlign: "center", padding: "12px 0 80px", opacity: 0.3, fontSize: 11, letterSpacing: 1 }}>
        DevNexus · {new Date().toLocaleDateString("bg-BG")}
      </div>
    </div>
  );
}
