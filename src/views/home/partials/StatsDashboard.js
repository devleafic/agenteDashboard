import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Chip,
  Spinner,
  Divider,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell
} from '@heroui/react';

function fmtDateYMD(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
const temporaryDisabled = true;
function formatDate(d = new Date()) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function formatMs(ms = 0) {
  if (!ms || ms <= 0) return '0m';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

const StatsDashboard = ({ userInfo }) => {
  const [date, setDate] = useState(() => fmtDateYMD());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [showTmoWidget, setShowTmoWidget] = useState(() => {
    try {
      return localStorage.getItem('showTmoWidget') !== 'false';
    } catch (e) {
      return true;
    }
  });

  const agentId = userInfo?._id;

  const fetchStats = async (d) => {
    if (!agentId) return;
    setLoading(true);
    setError(null);
    try {
      const base = process.env.REACT_APP_CENTRALITA;
      if (!base) {
        console.warn('REACT_APP_CENTRALITA no está definido; omitiendo fetchStats');
        setStats(null);
        setError('No está configurado el endpoint de la Centralita');
        return;
      }
      const url = `${base}/stats/agents/${agentId}`;
      const res = await axios.get(url, { params: { date: d } });
      if (res?.data?.success) {
        setStats(res.data.data || null);
      } else {
        setStats(null);
        setError('No data');
      }
    } catch (e) {
      setStats(null);
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, date]);

  // Auto-refresh on folio save/finalize and periodic polling
  useEffect(() => {
    if (!agentId) return;
    // Custom window event fallback: window.dispatchEvent(new CustomEvent('folio:stats:invalidate'))
    const onInvalidate = () => fetchStats(date);
    window.addEventListener('folio:stats:invalidate', onInvalidate);

    // BroadcastChannel to receive events from other tabs/components
    let bc = null;
    try {
      bc = new BroadcastChannel('folio-events');
      bc.onmessage = (ev) => {
        const t = ev?.data?.type;
        if (t === 'folio:save' || t === 'folio:finalize') {
          fetchStats(date);
        }
      };
    } catch (_) {
      // ignore if unsupported
    }

    // Periodic polling as safety net
    const id = setInterval(() => fetchStats(date), 15000);

    return () => {
      window.removeEventListener('folio:stats:invalidate', onInvalidate);
      if (bc) try { bc.close(); } catch (_) {}
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, date]);

  useEffect(() => {
    try {
      localStorage.setItem('showTmoWidget', String(showTmoWidget));
    } catch (e) {
      // ignore
    }
  }, [showTmoWidget]);

  const byChannelList = useMemo(() => {
    const arr = Array.isArray(stats?.byChannel) ? stats.byChannel : [];
    return arr.map((c) => ({
      channelId: c?.channelId,
      channelName: c?.channelName || (c?.channelId != null ? String(c.channelId) : '—'),
      saved: c?.saved || 0,
      finalized: c?.finalized || 0,
      tmoMs: c?.tmoMs || 0,
    }));
  }, [stats]);

  // Removed floating AvgTmoWidget; toolbar now owns the TMO widget

  const channelNameMap = useMemo(() => {
    const map = {};
    for (const ch of byChannelList) {
      if (ch?.channelId != null) map[String(ch.channelId)] = ch.channelName;
    }
    return map;
  }, [byChannelList]);

  // Derive TMO with safer fallbacks
  const computeDerivedTmoMs = (f) => {
    const serverTmo = typeof f?.tmoMs === 'number' ? f.tmoMs : null;
    const sessions = Array.isArray(f?.saveSessions) ? f.saveSessions : [];
    const sumSessions = sessions.reduce((acc, s) => acc + Math.max(0, Number(s?.tmoMs || 0)), 0);
    if (f?.finalizedAt) {
      // Finalizado: si servidor trae valor positivo, úsalo; si no, usa suma de sesiones
      if (serverTmo != null && serverTmo > 0) return serverTmo;
      if (sumSessions > 0) return sumSessions;
      return 0;
    }
    // En progreso: preferir suma de sesiones; luego servidor; luego fallback naive
    if (sumSessions > 0) return sumSessions;
    if (serverTmo != null && serverTmo > 0) return serverTmo;
    const start = f?.startedAt ? new Date(f.startedAt).getTime() : null;
    const end = f?.savedAt ? new Date(f.savedAt).getTime() : null;
    if (!start || !end) return 0;
    const diff = end - start;
    return diff > 0 ? diff : 0;
  };

  const recentFolios = useMemo(() => {
    const list = Array.isArray(stats?.folios) ? stats.folios : [];
    return list
      .map(f => ({ ...f, tmoMs: computeDerivedTmoMs(f) }))
      .slice(-10)
      .reverse();
  }, [stats]);

  const avgTmoMs = useMemo(() => {
    const serverAvg = stats?.averages?.tmoMs;
    if (typeof serverAvg === 'number') return serverAvg;
    const list = Array.isArray(stats?.folios) ? stats.folios : [];
    let sum = 0;
    let count = 0;
    for (const f of list) {
      if (f?.finalizedAt) {
        const t = computeDerivedTmoMs(f);
        if (t > 0) { sum += t; count += 1; }
        continue;
      }
      const sessions = Array.isArray(f?.saveSessions) ? f.saveSessions : [];
      if (sessions.length > 0) {
        for (const s of sessions) {
          const t = Number(s?.tmoMs || 0);
          if (t > 0) { sum += t; count += 1; }
        }
        continue;
      }
      const t = computeDerivedTmoMs(f);
      if (t > 0) { sum += t; count += 1; }
    }
    return count ? Math.round(sum / count) : 0;
  }, [stats]);

  const halfHourData = useMemo(() => {
    const bins = Array.from({ length: 48 }, (_, i) => ({
      label: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
      count: 0,
      tmoSum: 0,
      tmoCount: 0,
    }));
    const list = Array.isArray(stats?.folios) ? stats.folios : [];
    for (const f of list) {
      if (f?.finalizedAt) {
        const startDate = f?.startedAt ? new Date(f.startedAt) : null;
        if (!startDate) continue;
        const idx = startDate.getHours() * 2 + (startDate.getMinutes() >= 30 ? 1 : 0);
        if (idx < 0 || idx >= 48) continue;
        bins[idx].count += 1;
        const tmo = computeDerivedTmoMs(f);
        if (tmo > 0) {
          bins[idx].tmoSum += tmo;
          bins[idx].tmoCount += 1;
        }
        continue;
      }
      const sessions = Array.isArray(f?.saveSessions) ? f.saveSessions : [];
      if (sessions.length > 0) {
        for (const s of sessions) {
          const startDate = s?.startedAt ? new Date(s.startedAt) : null;
          if (!startDate) continue;
          const idx = startDate.getHours() * 2 + (startDate.getMinutes() >= 30 ? 1 : 0);
          if (idx < 0 || idx >= 48) continue;
          bins[idx].count += 1;
          const tmo = Number(s?.tmoMs || 0);
          if (tmo > 0) {
            bins[idx].tmoSum += tmo;
            bins[idx].tmoCount += 1;
          }
        }
        continue;
      }
      // Legacy: sin sesiones, usar folio
      const startDate = f?.startedAt ? new Date(f.startedAt) : null;
      if (!startDate) continue;
      const idx = startDate.getHours() * 2 + (startDate.getMinutes() >= 30 ? 1 : 0);
      if (idx < 0 || idx >= 48) continue;
      bins[idx].count += 1;
      const tmo = computeDerivedTmoMs(f);
      if (tmo > 0) {
        bins[idx].tmoSum += tmo;
        bins[idx].tmoCount += 1;
      }
    }
    const maxAvg = bins.reduce((m, b) => Math.max(m, b.tmoCount ? Math.round(b.tmoSum / b.tmoCount) : 0), 0);
    return { bins, maxAvg };
  }, [stats]);

  // Chart constants and Y-axis tick helpers (minutes)
  const CHART_HEIGHT_PX = 128; // matches h-32
  const maxAvgMinFloat = halfHourData.maxAvg / 60000;
  const pickStep = (mx) => {
    if (mx <= 0.5) return 0.1;
    if (mx <= 1) return 0.25;
    if (mx <= 3) return 0.5;
    if (mx <= 6) return 1;
    if (mx <= 15) return 2;
    if (mx <= 30) return 5;
    if (mx <= 60) return 10;
    return 15;
  };
  const stepMin = pickStep(maxAvgMinFloat || 0);
  const yTopMin = Math.max(stepMin, Math.ceil((maxAvgMinFloat || stepMin) / stepMin) * stepMin);
  const yMidMin = yTopMin / 2;
  const yTopMs = yTopMin * 60000;
  const fmtMinTick = (v) => (v >= 1 ? String(Math.round(v)) : v > 0 ? v.toFixed(1) : '0');
  const maxAvgMinLabel = fmtMinTick(yTopMin);
  const midAvgMinLabel = fmtMinTick(yMidMin);

  return (
    temporaryDisabled ? (
      <div className="p-4 md:p-6 h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
                                        Mis Estadísticas (Beta)
                                    </h2>
          <Chip color="danger" variant="flat">Temporalmente no disponible, pronto podras visualizar tus estadísticas de folios y tmo en tiempo real.</Chip>
        </div>
      </div>
    ) : (

    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Mis Estadísticas</h2>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-[160px]"
          />
          <Button onPress={() => fetchStats(date)} isDisabled={loading || !agentId}>
            Actualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-default-500">Agente</div>
            <div className="text-lg font-medium">{userInfo?.profile?.name || userInfo?.user || '—'}</div>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-default-500">
              <Spinner size="sm" /> Cargando
            </div>
          )}
          {error && (
            <Chip color="danger" variant="flat">{error}</Chip>
          )}
          
        </CardHeader>
        <Divider />
        <CardBody>
          {stats ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-3">
                  <div className="text-sm text-default-500">Iniciadas</div>
                  <div className="text-2xl font-semibold">{stats?.counts?.started || 0}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-sm text-default-500">Guardadas</div>
                  <div className="text-2xl font-semibold">{stats?.counts?.saved || 0}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-sm text-default-500">Finalizadas</div>
                  <div className="text-2xl font-semibold">{stats?.counts?.finalized || 0}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-sm text-default-500">TMO Promedio</div>
                  <div className="text-2xl font-semibold">{formatMs(avgTmoMs)}</div>
                </Card>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Por Canal</div>
                <div className="flex flex-wrap gap-2">
                  {byChannelList.length === 0 && <Chip variant="flat">Sin datos</Chip>}
                  {byChannelList.map((ch) => (
                    <Chip key={ch.channelId || ch.channelName} color="primary" variant="flat">
                      {ch.channelName}: {ch.saved} guard | {ch.finalized} fin | TMO {formatMs(ch.tmoMs)}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">TMO por medias horas</div>
                <div className="p-3 rounded-md border border-default-200">
                  <div className="flex">
                    <div className="w-12 pr-2">
                      <div className="h-32 flex flex-col justify-between items-end text-[10px] text-default-500">
                        <span>{maxAvgMinLabel}</span>
                        <span>{midAvgMinLabel}</span>
                        <span>0</span>
                      </div>
                      <div className="mt-1 text-[10px] text-default-500 text-right">min</div>
                    </div>
                    <div className="flex-1">
                      <div className="h-32 relative flex items-end gap-[2px]">
                        {/* grid lines */}
                        <div className="absolute inset-x-0 top-0 border-t border-dashed border-default-300" />
                        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-default-300" />
                        {halfHourData.bins.map((b, i) => {
                          const avg = b.tmoCount ? Math.round(b.tmoSum / b.tmoCount) : 0;
                          const h = yTopMs > 0 ? Math.max(2, Math.round((avg / yTopMs) * CHART_HEIGHT_PX)) : 2;
                          const opacity = b.count > 0 ? 1 : 0.3;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center">
                              <div
                                className="w-full bg-primary rounded-t-md"
                                style={{ height: `${h}px`, opacity }}
                                title={`${b.label}\nTMO ${formatMs(avg)}\n${b.count} folios`}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 grid grid-cols-12 text-[10px] text-default-500">
                        {Array.from({ length: 24 }, (_, h) => (
                          h % 2 === 0 ? <div key={h} className="col-span-1 text-center">{String(h).padStart(2, '0')}:00</div> : null
                        )).filter(Boolean)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Folios recientes</div>
                <Table aria-label="Folios recientes">
                  <TableHeader>
                    <TableColumn>FOLIO</TableColumn>
                    <TableColumn>CANAL</TableColumn>
                    <TableColumn>INICIO</TableColumn>
                    <TableColumn>FIN</TableColumn>
                    <TableColumn>TMO</TableColumn>
                    <TableColumn>ESTADO</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="Sin folios">
                    {recentFolios.map((f) => (
                      <TableRow key={`${f.folioId}-${f.finalizedAt || f.savedAt || f.startedAt}`}>
                        <TableCell>#{f.folioId}</TableCell>
                        <TableCell>{channelNameMap[String(f.channelId)] || (f?.channelId ? String(f.channelId) : (f?.channel ? String(f.channel) : '—'))}</TableCell>
                        <TableCell>{f.startedAt ? formatDate(new Date(f.startedAt)) : '—'}</TableCell>
                        <TableCell>{(f.finalizedAt || f.savedAt) ? formatDate(new Date(f.finalizedAt || f.savedAt)) : '—'}</TableCell>
                        <TableCell>{formatMs(computeDerivedTmoMs(f))}</TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            color={f.finalizedAt ? "danger" : f.savedAt ? "success" : "default"}
                            variant="flat"
                          >
                            {f.finalizedAt ? "Finalizado" : f.savedAt ? "Guardado" : "En progreso"}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-default-500">
              {!loading && 'Sin datos que mostrar'}
            </div>
          )}
        </CardBody>
      </Card>
    </div>)
    )}

  


export default StatsDashboard;
