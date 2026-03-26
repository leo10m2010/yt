import { useState, useEffect, useRef } from 'react';
import { 
  Download, Link2,
  Loader2, Terminal, Zap,
  Youtube, Twitter, Facebook, Instagram, Film,
  ChevronDown, ChevronUp, Globe,
  Play, FileAudio, FileVideo, List, Image as ImageIcon,
  Clock, Eye, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Types
interface VideoInfo {
  title: string;
  channel?: string;
  duration?: string;
  views?: number;
  thumbnail?: string;
  platform: string;
  is_playlist?: boolean;
  count?: number;
  entries?: Array<{ title: string; duration: string }>;
}

interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
}

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'youtube': return <Youtube className="w-5 h-5" />;
    case 'twitter': return <Twitter className="w-5 h-5" />;
    case 'facebook': return <Facebook className="w-5 h-5" />;
    case 'instagram': return <Instagram className="w-5 h-5" />;
    case 'tiktok': return <Film className="w-5 h-5" />;
    default: return <Globe className="w-5 h-5" />;
  }
};

const getPlatformColor = (platform: string): string => {
  switch (platform) {
    case 'youtube': return 'from-red-500 to-red-600';
    case 'tiktok': return 'from-cyan-400 to-blue-500';
    case 'twitter': return 'from-sky-400 to-blue-500';
    case 'facebook': return 'from-blue-500 to-blue-600';
    case 'instagram': return 'from-pink-500 via-purple-500 to-orange-500';
    default: return 'from-emerald-400 to-emerald-600';
  }
};

const getPlatformName = (platform: string): string => {
  switch (platform) {
    case 'youtube': return 'YouTube';
    case 'tiktok': return 'TikTok';
    case 'twitter': return 'X / Twitter';
    case 'facebook': return 'Facebook';
    case 'instagram': return 'Instagram';
    default: return 'Web';
  }
};

export default function App() {
  const [apiUrl] = useState('https://yt.tattto.site');
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'video' | 'audio'>('video');
  const [quality, setQuality] = useState('best');
  const [playlist, setPlaylist] = useState(false);
  const [embedThumbnail, setEmbedThumbnail] = useState(true);
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date() }]);
  };

  const clearLogs = () => setLogs([]);

  const fetchInfo = async () => {
    if (!url.trim()) {
      addLog('Ingresa una URL', 'warning');
      return;
    }

    setLoading(true);
    setInfo(null);
    addLog('Analizando URL...', 'info');

    try {
      const response = await fetch(`${apiUrl.replace(/\/$/, '')}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || response.statusText);
      }

      const data = await response.json();
      setInfo(data);
      addLog(`Listo: ${data.title.slice(0, 40)}...`, 'success');
      if (data.is_playlist) {
        setPlaylist(true);
      }
    } catch (error) {
      addLog((error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startDownload = async () => {
    if (!apiUrl || !url) return;

    setDownloading(true);
    setProgress(0);
    addLog(`Iniciando descarga ${mode}...`, 'info');

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * (playlist ? 2 : 5);
      });
    }, 500);

    try {
      const endpoint = playlist ? '/download/playlist' : '/download';
      const response = await fetch(`${apiUrl.replace(/\/$/, '')}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, mode, quality, playlist, thumbnail: embedThumbnail })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || response.statusText);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition') || '';
      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\r\n]+)["']?/i);
      const filename = match ? decodeURIComponent(match[1]) : (mode === 'audio' ? 'audio.mp3' : 'video.mp4');

      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);

      setProgress(100);
      addLog(`Descargado: ${filename}`, 'success');
    } catch (error) {
      clearInterval(progressInterval);
      addLog('Error: ' + (error as Error).message, 'error');
    } finally {
      setDownloading(false);
    }
  };

  const qualityOptions = mode === 'audio' 
    ? [{ value: 'best', label: 'Mejor calidad' }, { value: '320k', label: '320 kbps' }, { value: '192k', label: '192 kbps' }, { value: '128k', label: '128 kbps' }]
    : [{ value: 'best', label: 'Mejor calidad' }, { value: '1080p', label: '1080p' }, { value: '720p', label: '720p' }, { value: '480p', label: '480p' }, { value: '360p', label: '360p' }];

  const platforms = [
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-500' },
    { id: 'tiktok', name: 'TikTok', icon: Film, color: 'text-cyan-400' },
    { id: 'twitter', name: 'X', icon: Twitter, color: 'text-sky-400' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-500' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[200px]" />
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <Download className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight">Media<span className="text-emerald-400">DL</span></h1>
                <p className="text-[10px] text-white/40 -mt-0.5">Universal Downloader</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button
                className="px-4 py-2 rounded-md text-sm font-medium transition-all bg-emerald-500 text-black"
              >
                Descargar
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        
        {/* Download Tab */}
        {(
          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Left Column - Input & Options */}
            <div className="space-y-4">
              {/* URL Input */}
              <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-white/5">
                    <Label className="text-xs uppercase tracking-wider text-white/50">URL del contenido</Label>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="relative">
                      <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                      <Input
                        placeholder="https://youtube.com/watch?v=..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
                        className="pl-12 h-14 bg-black/30 border-white/10 text-lg focus:border-emerald-500/50"
                      />
                    </div>
                    <Button
                      onClick={fetchInfo}
                      disabled={loading}
                      className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
                    >
                      {loading ? (
                        <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Analizando...</>
                      ) : (
                        <><Zap className="w-5 h-5 mr-2" /> Analizar URL</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Mode Selection */}
              <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm">
                <CardContent className="p-4">
                  <Label className="text-xs uppercase tracking-wider text-white/50 mb-3 block">Modo de descarga</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMode('video')}
                      className={cn(
                        "relative p-4 rounded-xl border transition-all duration-300 text-left group",
                        mode === 'video'
                          ? "border-emerald-500/50 bg-emerald-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors",
                        mode === 'video' ? "bg-emerald-500 text-black" : "bg-white/10 text-white/60"
                      )}>
                        <FileVideo className="w-5 h-5" />
                      </div>
                      <div className="font-semibold">Video</div>
                      <div className="text-xs text-white/50">MP4 format</div>
                      {mode === 'video' && (
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => setMode('audio')}
                      className={cn(
                        "relative p-4 rounded-xl border transition-all duration-300 text-left group",
                        mode === 'audio'
                          ? "border-emerald-500/50 bg-emerald-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors",
                        mode === 'audio' ? "bg-emerald-500 text-black" : "bg-white/10 text-white/60"
                      )}>
                        <FileAudio className="w-5 h-5" />
                      </div>
                      <div className="font-semibold">Audio</div>
                      <div className="text-xs text-white/50">MP3 format</div>
                      {mode === 'audio' && (
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Quality & Options */}
              <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-white/50 mb-2 block">Calidad</Label>
                    <Select value={quality} onValueChange={setQuality}>
                      <SelectTrigger className="bg-black/30 border-white/10 h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a20] border-white/10">
                        {qualityOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="focus:bg-emerald-500/20">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator className="bg-white/5" />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <List className="w-4 h-4 text-white/60" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Playlist completa</div>
                          <div className="text-xs text-white/50">Descargar todos los videos</div>
                        </div>
                      </div>
                      <Switch checked={playlist} onCheckedChange={setPlaylist} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-white/60" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Incrustar carátula</div>
                          <div className="text-xs text-white/50">Añadir thumbnail al archivo</div>
                        </div>
                      </div>
                      <Switch checked={embedThumbnail} onCheckedChange={setEmbedThumbnail} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Download Button */}
              <Button
                onClick={startDownload}
                disabled={downloading || !url || !info}
                className={cn(
                  "w-full h-14 text-lg font-bold rounded-xl transition-all duration-300",
                  downloading
                    ? "bg-emerald-500/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black shadow-lg shadow-emerald-500/25"
                )}
              >
                {downloading ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Descargando...</>
                ) : (
                  <><Download className="w-5 h-5 mr-2" /> {playlist ? 'Descargar Playlist' : 'Descargar'}</>
                )}
              </Button>
            </div>

            {/* Right Column - Preview & Progress */}
            <div className="space-y-4">
              {/* Video Preview */}
              {info ? (
                <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                  {info.thumbnail && (
                    <div className="relative aspect-video">
                      <img
                        src={info.thumbnail}
                        alt={info.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3">
                        <Badge className={cn(
                          "bg-gradient-to-r text-white border-0",
                          getPlatformColor(info.platform)
                        )}>
                          {getPlatformIcon(info.platform)}
                          <span className="ml-1.5">{getPlatformName(info.platform)}</span>
                        </Badge>
                      </div>
                      {info.is_playlist && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-purple-500/80 text-white border-0">
                            <List className="w-3 h-3 mr-1" />
                            {info.count} videos
                          </Badge>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-semibold text-lg line-clamp-2">{info.title}</h3>
                      </div>
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      {info.channel && (
                        <div>
                          <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-1">
                            <User className="w-3 h-3" /> Canal
                          </div>
                          <div className="text-sm font-medium truncate">{info.channel}</div>
                        </div>
                      )}
                      {info.duration && (
                        <div>
                          <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-1">
                            <Clock className="w-3 h-3" /> Duración
                          </div>
                          <div className="text-sm font-medium">{info.duration}</div>
                        </div>
                      )}
                      {info.views && (
                        <div>
                          <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-1">
                            <Eye className="w-3 h-3" /> Vistas
                          </div>
                          <div className="text-sm font-medium">{info.views.toLocaleString()}</div>
                        </div>
                      )}
                    </div>

                    {/* Playlist Items */}
                    {info.is_playlist && info.entries && (
                      <>
                        <Separator className="my-4 bg-white/5" />
                        <button
                          onClick={() => setShowPlaylist(!showPlaylist)}
                          className="w-full flex items-center justify-between text-sm text-white/60 hover:text-white transition-colors"
                        >
                          <span>Ver videos ({info.entries.length})</span>
                          {showPlaylist ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {showPlaylist && (
                          <ScrollArea className="h-48 mt-3">
                            <div className="space-y-1 pr-3">
                              {info.entries.slice(0, 50).map((entry, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 text-sm hover:bg-white/10 transition-colors"
                                >
                                  <span className="text-emerald-400 font-mono text-xs w-6">{i + 1}</span>
                                  <span className="flex-1 truncate">{entry.title || '—'}</span>
                                  <span className="text-white/40 text-xs">{entry.duration || ''}</span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm border-dashed">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                      <Play className="w-8 h-8 text-white/20" />
                    </div>
                    <h3 className="text-lg font-medium text-white/60">Sin contenido</h3>
                    <p className="text-sm text-white/40 mt-1">Pega una URL para ver la vista previa</p>
                  </CardContent>
                </Card>
              )}

              {/* Progress */}
              <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progreso</span>
                    <span className="text-sm font-mono text-emerald-400">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        downloading ? "progress-bar-animated" : "bg-emerald-500"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Terminal */}
              <Card className="bg-black/50 border-white/10 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-medium">Terminal</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearLogs} className="h-6 text-xs text-white/50 hover:text-white">
                      Limpiar
                    </Button>
                  </div>
                  <ScrollArea className="h-40">
                    <div className="p-3 space-y-1 font-mono text-xs">
                      {logs.length === 0 && (
                        <div className="text-white/30 italic">// Esperando acción...</div>
                      )}
                      {logs.map((log, i) => (
                        <div
                          key={i}
                          className={cn(
                            "animate-in fade-in duration-200",
                            log.type === 'success' && "text-emerald-400",
                            log.type === 'error' && "text-red-400",
                            log.type === 'warning' && "text-yellow-400",
                            log.type === 'info' && "text-blue-400"
                          )}
                        >
                          <span className="text-white/30">[{log.timestamp.toLocaleTimeString('es-ES', { hour12: false })}]</span>{' '}
                          {log.message}
                        </div>
                      ))}
                      <div ref={logEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>Powered by yt-dlp</span>
            <span>MediaDL v2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
