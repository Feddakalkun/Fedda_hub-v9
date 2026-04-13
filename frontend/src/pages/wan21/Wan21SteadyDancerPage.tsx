import { useEffect, useRef, useState } from 'react';
import { Film, Loader2, RefreshCw, Upload, Video } from 'lucide-react';
import { BACKEND_API } from '../../config/api';
import { useToast } from '../../components/ui/Toast';
import { useComfyExecution } from '../../contexts/ComfyExecutionContext';
import { usePersistentState } from '../../hooks/usePersistentState';
import { comfyService } from '../../services/comfyService';
import { PromptAssistant } from '../../components/ui/PromptAssistant';
import { LoraSelector } from '../../components/ui/LoraSelector';
import { FeddaButton, FeddaSectionTitle } from '../../components/ui/FeddaPrimitives';
import { VideoOutputPanel } from '../../components/layout/VideoOutputPanel';

function UploadCard({
  label,
  accept,
  previewUrl,
  uploading,
  onFile,
}: {
  label: string;
  accept: string;
  previewUrl: string | null;
  uploading: boolean;
  onFile: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const isVideo = accept.includes('video');
  return (
    <div
      onClick={() => ref.current?.click()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) onFile(file);
      }}
      onDragOver={(e) => e.preventDefault()}
      className="relative rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] hover:border-violet-500/30 transition-all cursor-pointer overflow-hidden min-h-[160px]"
    >
      {previewUrl ? (
        <div className="h-full">
          {isVideo ? (
            <video src={previewUrl} className="w-full h-full object-cover min-h-[160px]" muted loop autoPlay playsInline />
          ) : (
            <img src={previewUrl} alt={label} className="w-full h-full object-cover min-h-[160px]" />
          )}
          <div className="absolute inset-0 bg-black/45 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/75">Replace</span>
          </div>
        </div>
      ) : (
        <div className="h-full min-h-[160px] flex flex-col items-center justify-center gap-2">
          {uploading ? <Loader2 className="w-6 h-6 animate-spin text-violet-400/70" /> : <Upload className="w-6 h-6 text-white/15" />}
          <span className="text-[9px] font-black uppercase tracking-widest text-white/25">{uploading ? 'Uploading...' : label}</span>
        </div>
      )}
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </div>
  );
}

function VideoScrubberCard({
  previewUrl,
  uploading,
  onFile,
  startSec,
  endSec,
  onStartChange,
  onEndChange,
  onExtract,
}: {
  previewUrl: string | null;
  uploading: boolean;
  onFile: (file: File) => void;
  startSec: number;
  endSec: number;
  onStartChange: (val: number) => void;
  onEndChange: (val: number) => void;
  onExtract: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);

  if (!previewUrl) {
    return (
      <div
        onClick={() => ref.current?.click()}
        className="relative rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] hover:border-violet-500/30 transition-all cursor-pointer overflow-hidden min-h-[160px] flex flex-col items-center justify-center gap-2"
      >
        {uploading ? <Loader2 className="w-6 h-6 animate-spin text-violet-400/70" /> : <Upload className="w-6 h-6 text-white/15" />}
        <span className="text-[9px] font-black uppercase tracking-widest text-white/25">
          {uploading ? 'Uploading...' : 'Reference Motion Video'}
        </span>
        <input
          ref={ref}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-white/[0.02] border border-white/[0.08] rounded-xl relative">
      <video
        ref={videoRef}
        src={previewUrl}
        controls
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        className="w-full rounded-lg bg-black aspect-video object-contain"
      />
      <div className="flex gap-2">
        <button
          onClick={() => ref.current?.click()}
          className="flex-1 bg-white/5 border border-white/10 text-white/50 py-1.5 rounded-lg text-[10px] uppercase tracking-wider hover:bg-white/10 transition-colors"
        >
          Replace Video
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-1">
        <div className="bg-black/40 p-2 rounded-lg border border-white/5 flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-wider text-white/40">Set Start</span>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-violet-300">{startSec.toFixed(2)}s</span>
            <button
              onClick={() => onStartChange(currentTime)}
              className="bg-violet-500/20 text-violet-200 px-2 py-1 rounded text-[9px] hover:bg-violet-500/40 transition-colors"
            >
              Use Current
            </button>
          </div>
        </div>
        <div className="bg-black/40 p-2 rounded-lg border border-white/5 flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-wider text-white/40">Set End</span>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-cyan-300">{endSec.toFixed(2)}s</span>
            <button
              onClick={() => onEndChange(currentTime)}
              className="bg-cyan-500/20 text-cyan-200 px-2 py-1 rounded text-[9px] hover:bg-cyan-500/40 transition-colors"
            >
              Use Current
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={onExtract}
        className="w-full mt-1 bg-violet-500/10 border border-violet-500/20 text-violet-300 py-2 rounded-lg text-[10px] uppercase tracking-widest hover:bg-violet-500/20 transition-colors flex items-center justify-center gap-2"
      >
        <Film className="w-3.5 h-3.5" />
        Extract Frame to Persona
      </button>

      <input
        ref={ref}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </div>
  );
}

export const Wan21SteadyDancerPage = () => {
  const [prompt, setPrompt] = usePersistentState(
    'wan21_sd_prompt',
    'full body dancing, smooth rhythm, stable body proportions, cinematic lighting, natural motion',
  );
  const [width, setWidth] = usePersistentState('wan21_sd_width', 512);
  const [height, setHeight] = usePersistentState('wan21_sd_height', 512);
  const [videoStartSeconds, setVideoStartSeconds] = usePersistentState('wan21_sd_start_sec', 0);
  const [videoLength, setVideoLength] = usePersistentState('wan21_sd_length', 5);
  const [fps, setFps] = usePersistentState('wan21_sd_fps', 24);
  const [slowMotion, setSlowMotion] = usePersistentState('wan21_sd_slowmo_v1', 1);
  const [seed, setSeed] = usePersistentState('wan21_sd_seed', -1);
  const [steps, setSteps] = usePersistentState('wan21_sd_steps', 4);
  const [cfg, setCfg] = usePersistentState('wan21_sd_cfg', 1);
  const [poseSpatial, setPoseSpatial] = usePersistentState('wan21_sd_pose_spatial', 1);
  const [poseTemporal, setPoseTemporal] = usePersistentState('wan21_sd_pose_temporal', 1);
  const [loraName, setLoraName] = usePersistentState('wan21_sd_lora_name', '');
  const [loraStrength, setLoraStrength] = usePersistentState('wan21_sd_lora_strength', 1);

  const [subjectImageFile, setSubjectImageFile] = usePersistentState<string | null>('wan21_sd_subject_image', null);
  const [motionVideoFile, setMotionVideoFile] = usePersistentState<string | null>('wan21_sd_motion_video', null);
  const [uploadingSubject, setUploadingSubject] = useState(false);
  const [uploadingMotion, setUploadingMotion] = useState(false);
  const [isExtractingCaption, setIsExtractingCaption] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingPromptId, setPendingPromptId] = useState<string | null>(null);
  const [isGeneratingPersona, setIsGeneratingPersona] = useState(false);
  const [pendingPersonaPromptId, setPendingPersonaPromptId] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = usePersistentState<string | null>('wan21_sd_current_video', null);
  const [history, setHistory] = usePersistentState<string[]>('wan21_sd_history', []);
  const [availableLoras, setAvailableLoras] = useState<string[]>([]);

  const prevCountRef = useRef(0);
  const sessionRef = useRef<string[]>([]);

  const { toast } = useToast();
  const { state: execState, lastOutputVideos, lastOutputImages, outputReadyCount, registerNodeMap } = useComfyExecution();

  const subjectPreview = subjectImageFile ? `/comfy/view?filename=${encodeURIComponent(subjectImageFile)}&type=input` : null;
  const motionPreview = motionVideoFile ? `/comfy/view?filename=${encodeURIComponent(motionVideoFile)}&type=input` : null;

  useEffect(() => {
    comfyService
      .getLoras()
      .then((loras) => {
        setAvailableLoras(loras);
      })
      .catch(() => {});
  }, []);

  const uploadFile = async (
    file: File,
    setFilename: (name: string) => void,
    setUploading: (value: boolean) => void,
  ) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${BACKEND_API.BASE_URL}/api/upload`, { method: 'POST', body: form });
      const data = await res.json();
      if (!data.success) throw new Error(data.detail || 'Upload failed');
      setFilename(data.filename);
    } catch (error: any) {
      toast(error.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!isGenerating && !pendingPromptId) return;
    if (!lastOutputVideos?.length) return;
    const newVids = lastOutputVideos.slice(prevCountRef.current);
    if (!newVids.length) return;
    prevCountRef.current = lastOutputVideos.length;
    const urls = newVids.map(
      (v) => `/comfy/view?filename=${encodeURIComponent(v.filename)}&subfolder=${encodeURIComponent(v.subfolder)}&type=${v.type}`,
    );
    sessionRef.current = [...sessionRef.current, ...urls];
    setCurrentVideo(urls[0]);
    setHistory((prev) => [...urls, ...prev.filter((u) => !urls.includes(u))].slice(0, 40));
  }, [outputReadyCount, lastOutputVideos, isGenerating, pendingPromptId, setCurrentVideo, setHistory]);

  const handleExtractFrame = async () => {
    if (!motionVideoFile) return;
    try {
      const res = await fetch(`${BACKEND_API.BASE_URL}/api/video/extract-frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_filename: motionVideoFile,
          target_time_sec: videoStartSeconds,
        }),
      });
      const data = await res.json();
      if (data.success && data.filename) {
        setSubjectImageFile(data.filename);
        toast(`Extracted frame at ${videoStartSeconds.toFixed(2)}s! Analyzing pose...`, 'success');
        
        setIsExtractingCaption(true);
        try {
            const capRes = await fetch(`${BACKEND_API.BASE_URL}/api/vision/caption`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ image_filename: data.filename })
            });
            const capData = await capRes.json();
            if (capData.success && capData.caption) {
                setPrompt(`A raw candid photo of 21yo beautiful Froy woman. ${capData.caption}`);
                toast('Pose and environment analyzed! Ready to render persona.', 'success');
            }
        } catch(e) {
            console.error('Caption failed', e);
        } finally {
            setIsExtractingCaption(false);
        }

      } else throw new Error(data.error || 'Failed to extract frame');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  // Handlers for Persona generation (Z-Image)
  useEffect(() => {
    if (!pendingPersonaPromptId) return;
    if (execState === 'error') {
      setIsGeneratingPersona(false);
      setPendingPersonaPromptId(null);
      return;
    }
    if (execState === 'done') {
      setIsGeneratingPersona(false);
      setPendingPersonaPromptId(null);
      
      // Auto-assign the generated image to the subject slot
      if (lastOutputImages && lastOutputImages.length > 0) {
          const img = lastOutputImages[lastOutputImages.length - 1];
          // We must take the OUTPUT image and upload it to the INPUT directory so the 
          // WAN 2.1 workflow's LoadImage node can use it as the starting frame.
          const imageUrl = `/comfy/view?filename=${encodeURIComponent(img.filename)}&type=${img.type}&subfolder=${img.subfolder || ''}`;
          
          fetch(imageUrl)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], `ready_${img.filename}`, { type: blob.type });
                // We use our existing uploadFile mechanism to neatly put it into the ComfyUI input folder
                uploadFile(
                    file, 
                    (name) => {
                        setSubjectImageFile(name);
                        toast('Persona rendered and applied as Start Frame!', 'success');
                    }, 
                    setUploadingSubject
                );
            })
            .catch(e => console.error("Could not loopback image:", e));
      }
    }
  }, [execState, pendingPersonaPromptId, lastOutputImages, toast, setSubjectImageFile]);

  const handleGeneratePersona = async () => {
    if (!prompt.trim() || isGeneratingPersona) return;
    setIsGeneratingPersona(true);

    fetch(`${BACKEND_API.BASE_URL}/api/workflow/node-map/z-image`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) registerNodeMap(d.node_map);
      })
      .catch(() => {});

    try {
      const res = await fetch(`${BACKEND_API.BASE_URL}${BACKEND_API.ENDPOINTS.GENERATE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: 'z-image',
          params: {
            prompt: prompt.trim(),
            width: 720,
            height: 1280,
            steps: 4,
            seed: seed === -1 ? Math.floor(Math.random() * 10_000_000_000) : seed,
            loras: loraName ? [{ name: loraName, strength: loraStrength }] : [],
            client_id: (comfyService as any).clientId,
          },
        }),
      });
      const data = await res.json();
      if (data.success) setPendingPersonaPromptId(data.prompt_id);
      else throw new Error(data.detail || 'Failed');
    } catch (error: any) {
      toast(error.message || 'Failed to start Z-Image', 'error');
      setIsGeneratingPersona(false);
    }
  };

  useEffect(() => {
    if (!pendingPromptId) return;
    if (execState === 'error') {
      setIsGenerating(false);
      setPendingPromptId(null);
      return;
    }
    if (execState !== 'done') return;
    setIsGenerating(false);
    setPendingPromptId(null);
    toast('SteadyDancer video ready', 'success');
  }, [execState, pendingPromptId, toast]);

  const handleGenerate = async () => {
    if (!subjectImageFile || !motionVideoFile || !prompt.trim() || isGenerating) return;
    sessionRef.current = [];
    prevCountRef.current = lastOutputVideos?.length ?? 0;
    setCurrentVideo(null);
    setIsGenerating(true);

    fetch(`${BACKEND_API.BASE_URL}/api/workflow/node-map/wan21-steady-dancer`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) registerNodeMap(d.node_map);
      })
      .catch(() => {});

    try {
      const res = await fetch(`${BACKEND_API.BASE_URL}${BACKEND_API.ENDPOINTS.GENERATE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: 'wan21-steady-dancer',
          params: {
            image: subjectImageFile,
            reference_video: motionVideoFile,
            prompt: prompt.trim(),
            width,
            height,
            video_length_seconds: videoLength,
            video_start_frame: Math.round(videoStartSeconds * fps),
            video_frame_load_cap: Math.round(videoLength * fps),
            fps,
            rife_multiplier: slowMotion === 1 ? 2 : slowMotion,
            output_fps: slowMotion === 1 ? fps * 2 : fps,
            steps,
            cfg,
            pose_strength_spatial: poseSpatial,
            pose_strength_temporal: poseTemporal,
            seed: seed === -1 ? Math.floor(Math.random() * 10_000_000_000) : seed,
            ...(loraName ? { lora_name: loraName, lora_strength: loraStrength } : {}),
            client_id: (comfyService as any).clientId,
          },
        }),
      });
      const data = await res.json();
      if (data.success) setPendingPromptId(data.prompt_id);
      else throw new Error(data.detail || 'Failed');
    } catch (error: any) {
      toast(error.message || 'Failed to start generation', 'error');
      setIsGenerating(false);
    }
  };

  const canGenerate = !!subjectImageFile && !!motionVideoFile && !!prompt.trim() && !isGenerating;

  return (
    <div className="flex h-full bg-[#080808] overflow-hidden">
      <div className="flex-1 min-w-0 flex flex-col border-r border-white/[0.04] overflow-y-auto custom-scrollbar">
        <div className="px-5 py-5 space-y-5">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-violet-400" />
            <h2 className="fedda-kicker">WAN 2.1 - Steady Dancer</h2>
          </div>

          <div className="space-y-2">
            <FeddaSectionTitle className="text-white/20">Inputs</FeddaSectionTitle>
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2">
                <VideoScrubberCard
                  previewUrl={motionPreview}
                  uploading={uploadingMotion}
                  onFile={(file) => uploadFile(file, (name) => setMotionVideoFile(name), setUploadingMotion)}
                  startSec={videoStartSeconds}
                  endSec={videoStartSeconds + videoLength}
                  onStartChange={(val) => {
                    setVideoStartSeconds(val);
                    // Ensure length is valid
                    if (videoStartSeconds + videoLength <= val) {
                      setVideoLength(1.0); // Fallback length if start goes beyond end
                    }
                  }}
                  onEndChange={(val) => {
                    const newLength = val - videoStartSeconds;
                    if (newLength > 0) setVideoLength(newLength);
                  }}
                  onExtract={handleExtractFrame}
                />
              </div>

              <div className="space-y-2">
                <UploadCard
                  label="Subject Image"
                  accept="image/*"
                  previewUrl={subjectPreview}
                  uploading={uploadingSubject}
                  onFile={(file) => uploadFile(file, (name) => setSubjectImageFile(name), setUploadingSubject)}
                />
              </div>
            </div>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-end">
                 <h3 className="text-[12px] font-bold text-white/70 uppercase tracking-widest">Persona Generation (Z-Image)</h3>
                 {isExtractingCaption && <span className="text-[10px] text-violet-400 animate-pulse">Running Vision Model...</span>}
              </div>
              <PromptAssistant
                context="wan-scene"
                value={prompt}
                onChange={setPrompt}
                placeholder="Extract a frame to auto-caption the scene, or write manually..."
                minRows={4}
                accent="violet"
                label="Prompt Structure"
                enableCaption={false}
              />

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <LoraSelector
                    label="Persona LoRA"
                    value={loraName}
                    onChange={setLoraName}
                    strength={loraStrength}
                    onStrengthChange={setLoraStrength}
                    options={availableLoras || []}
                    />
                </div>
                <FeddaButton 
                    variant="violet" 
                    onClick={handleGeneratePersona} 
                    disabled={isGeneratingPersona || !prompt.trim()}
                    className="w-[180px] shrink-0"
                >
                    {isGeneratingPersona ? 'Rendering...' : 'Render Base Image'}
                </FeddaButton>
              </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <label className="text-[10px] text-white/35">Width
              <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value) || 512)} className="mt-1 w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-2 py-2 text-[11px] font-mono" />
            </label>
            <label className="text-[10px] text-white/35">Height
              <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value) || 512)} className="mt-1 w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-2 py-2 text-[11px] font-mono" />
            </label>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <label className="text-[10px] text-white/35">Start At (sec)
              <input type="number" value={videoStartSeconds} min={0} onChange={(e) => setVideoStartSeconds(Number(e.target.value) || 0)} className="mt-1 w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-2 py-2 text-[11px] font-mono" />
            </label>
            <label className="text-[10px] text-white/35">Length (sec)
              <input type="number" value={videoLength} min={2} max={20} onChange={(e) => setVideoLength(Number(e.target.value) || 5)} className="mt-1 w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-2 py-2 text-[11px] font-mono" />
            </label>
            <label className="text-[10px] text-white/35">Base FPS
              <input type="number" value={fps} min={12} max={60} onChange={(e) => setFps(Number(e.target.value) || 24)} className="mt-1 w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-2 py-2 text-[11px] font-mono" />
            </label>
            <label className="text-[10px] text-white/35">Slow Motion
              <select value={slowMotion} onChange={(e) => setSlowMotion(Number(e.target.value))} className="mt-1 w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-2 py-2 text-[11px] font-mono text-white/80 outline-none hover:bg-white/[0.05]">
                <option value={1} className="bg-slate-900">1x (Smooth Double FPS)</option>
                <option value={2} className="bg-slate-900">2x Slower (Base FPS)</option>
                <option value={4} className="bg-slate-900">4x Slower (Base FPS)</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <label className="text-[10px] text-white/35">Steps
              <input type="number" value={steps} min={1} max={12} onChange={(e) => setSteps(Number(e.target.value) || 4)} className="mt-1 w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-2 py-2 text-[11px] font-mono" />
            </label>
            <label className="text-[10px] text-white/35">CFG
              <input type="number" value={cfg} step={0.1} min={0.5} max={3} onChange={(e) => setCfg(Number(e.target.value) || 1)} className="mt-1 w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-2 py-2 text-[11px] font-mono" />
            </label>
            <label className="text-[10px] text-white/35">Pose Spatial
              <input type="number" value={poseSpatial} step={0.1} min={0} max={2} onChange={(e) => setPoseSpatial(Number(e.target.value) || 1)} className="mt-1 w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-2 py-2 text-[11px] font-mono" />
            </label>
            <label className="text-[10px] text-white/35">Pose Temporal
              <input type="number" value={poseTemporal} step={0.1} min={0} max={2} onChange={(e) => setPoseTemporal(Number(e.target.value) || 1)} className="mt-1 w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-2 py-2 text-[11px] font-mono" />
            </label>
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value))}
              className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-xl py-2.5 px-3 text-[11px] font-mono text-white/35 focus:border-violet-500/20 outline-none"
            />
            <FeddaButton onClick={() => setSeed(-1)} variant={seed === -1 ? 'violet' : 'ghost'} className="p-2.5 rounded-xl">
              <RefreshCw className="w-3.5 h-3.5" />
            </FeddaButton>
          </div>

          <LoraSelector
            label="SteadyDancer LoRA (optional override)"
            value={loraName}
            onChange={setLoraName}
            strength={loraStrength}
            onStrengthChange={setLoraStrength}
            options={availableLoras}
            accent="violet"
          />

          <div className="pb-5">
            <FeddaButton
              disabled={!canGenerate}
              onClick={handleGenerate}
              variant="violet"
              className="w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.35em] flex items-center justify-center gap-3 disabled:bg-white/[0.03] disabled:text-white/10"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              <span>{isGenerating ? 'Generating...' : 'Generate Motion Transfer'}</span>
            </FeddaButton>
          </div>
        </div>
      </div>

      <VideoOutputPanel
        title="WAN 2.1 SteadyDancer Output"
        currentVideo={currentVideo}
        history={history}
        isGenerating={isGenerating}
      />
    </div>
  );
};
