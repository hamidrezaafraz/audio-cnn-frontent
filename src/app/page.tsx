"use client";

import { useEffect, useRef, useState } from "react";
import { analyzeAudio } from "~/app/actions";
import AudioPlayer from "~/components/AudioPlayer";
import ColorScale from "~/components/ColorScale";
import FeatureMap from "~/components/FeatureMap";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import Waveform from "~/components/Waveform";
import type { ApiResponse, LayerData, VisualizationData } from "~/lib/types";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

const ESC50_EMOJI_MAP: Record<string, string> = {
  dog: "🐕",
  rain: "🌧️",
  crying_baby: "👶",
  door_wood_knock: "🚪",
  helicopter: "🚁",
  rooster: "🐓",
  sea_waves: "🌊",
  sneezing: "🤧",
  mouse_click: "🖱️",
  chainsaw: "🪚",
  pig: "🐷",
  crackling_fire: "🔥",
  clapping: "👏",
  keyboard_typing: "⌨️",
  siren: "🚨",
  cow: "🐄",
  crickets: "🦗",
  breathing: "💨",
  door_wood_creaks: "🚪",
  car_horn: "📯",
  frog: "🐸",
  chirping_birds: "🐦",
  coughing: "😷",
  can_opening: "🥫",
  engine: "🚗",
  cat: "🐱",
  water_drops: "💧",
  footsteps: "👣",
  washing_machine: "🧺",
  train: "🚂",
  hen: "🐔",
  wind: "💨",
  laughing: "😂",
  vacuum_cleaner: "🧹",
  church_bells: "🔔",
  insects: "🦟",
  pouring_water: "🚰",
  brushing_teeth: "🪥",
  clock_alarm: "⏰",
  airplane: "✈️",
  sheep: "🐑",
  toilet_flush: "🚽",
  snoring: "😴",
  clock_tick: "⏱️",
  fireworks: "🎆",
  crow: "🐦‍⬛",
  thunderstorm: "⛈️",
  drinking_sipping: "🥤",
  glass_breaking: "🔨",
  hand_saw: "🪚",
};

const getEmojiForClass = (className: string): string =>
  ESC50_EMOJI_MAP[className] ?? "🔈";

function splitLayers(visualization: VisualizationData) {
  const main: [string, LayerData][] = [];
  const internals: Record<string, [string, LayerData][]> = {};

  for (const [name, data] of Object.entries(visualization)) {
    if (!name.includes(".")) {
      main.push([name, data]);
    } else {
      const [parent] = name.split(".");
      if (parent === undefined) continue;
      (internals[parent] ??= []).push([name, data]);
    }
  }

  return { main, internals };
}

const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [vizData, setVizData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke the previous object URL whenever a new file is chosen or on unmount.
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file
    if (!selected) return;

    setError(null);
    setVizData(null);

    if (selected.size > MAX_FILE_BYTES) {
      setError("That file is too large. Please choose one under 20 MB.");
      return;
    }

    setFile(selected);
    setAudioUrl(URL.createObjectURL(selected));
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setVizData(null);

    try {
      const formData = new FormData();
      formData.append("audio", file);
      const result = await analyzeAudio(formData);
      if (result.ok) {
        setVizData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const { main, internals } = vizData
    ? splitLayers(vizData.visualization)
    : { main: [], internals: {} };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-light tracking-tight text-stone-900">
            CNN Audio Visualizer
          </h1>
          <p className="text-stone-600">
            Upload an audio clip, listen to it, then analyze it to see the
            model&apos;s predictions and what each layer &quot;sees&quot;.
          </p>
        </header>

        {/* Upload + playback */}
        <Card className="mx-auto mb-8 max-w-3xl">
          <CardContent className="space-y-5">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <input
                  ref={inputRef}
                  type="file"
                  accept=".wav,.flac,.ogg,.mp3,audio/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                <Button
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                  disabled={isLoading}
                >
                  {file ? "Change file" : "Choose audio file"}
                </Button>
                {file ? (
                  <Badge variant="secondary" className="max-w-[16rem] truncate">
                    {file.name} · {formatBytes(file.size)}
                  </Badge>
                ) : (
                  <span className="text-sm text-stone-500">WAV works best</span>
                )}
              </div>

              <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={!file || isLoading}
              >
                {isLoading && (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {isLoading ? "Analyzing..." : "Analyze"}
              </Button>
            </div>

            {audioUrl ? (
              <AudioPlayer src={audioUrl} />
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-sm text-stone-500 transition-colors hover:border-stone-400 hover:bg-stone-100"
              >
                No audio selected yet. Click to upload a clip.
              </button>
            )}

            {isLoading && (
              <p className="text-center text-xs text-stone-500">
                The first request can take a little longer while the model
                server starts up.
              </p>
            )}
          </CardContent>
        </Card>

        {error && (
          <Card className="mx-auto mb-8 max-w-3xl border-red-200 bg-red-50">
            <CardContent>
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {vizData && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-stone-900">
                  Top Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vizData.predictions.slice(0, 3).map((pred, i) => (
                    <div key={pred.class} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-stone-700 capitalize">
                          <span className="mr-2">
                            {getEmojiForClass(pred.class)}
                          </span>
                          {pred.class.replaceAll("_", " ")}
                        </div>
                        <Badge variant={i === 0 ? "default" : "secondary"}>
                          {(pred.confidence * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <Progress value={pred.confidence * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-stone-900">
                    Input Spectrogram
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FeatureMap
                    data={vizData.input_spectrogram.values}
                    title={vizData.input_spectrogram.shape.join(" x ")}
                    spectrogram
                  />
                  <div className="mt-5 flex justify-end">
                    <ColorScale width={200} height={16} min={-1} max={1} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-stone-900">
                    Audio Waveform
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Waveform
                    data={vizData.waveform.values}
                    title={`${vizData.waveform.duration.toFixed(2)}s · ${vizData.waveform.sample_rate} Hz`}
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-stone-900">
                  Convolutional Layer Outputs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                  {main.map(([mainName, mainData]) => (
                    <div key={mainName} className="space-y-4">
                      <div>
                        <h4 className="mb-2 font-medium text-stone-700">
                          {mainName}
                        </h4>
                        <FeatureMap
                          data={mainData.values}
                          title={mainData.shape.join(" x ")}
                        />
                      </div>

                      {internals[mainName] && (
                        <div className="h-80 overflow-y-auto rounded border border-stone-200 bg-stone-50 p-2">
                          <div className="space-y-2">
                            {[...internals[mainName]]
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([layerName, layerData]) => (
                                <FeatureMap
                                  key={layerName}
                                  data={layerData.values}
                                  title={layerName.replace(`${mainName}.`, "")}
                                  internal
                                />
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex justify-end">
                  <ColorScale width={200} height={16} min={-1} max={1} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
