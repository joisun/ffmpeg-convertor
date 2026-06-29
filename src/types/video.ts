export interface VideoFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  requiredParams: Array<keyof VideoConversionParams>;
  description: string;
}

export interface VideoConversionParams {
  format: string;
  quality: number;
  width?: number;
  height?: number;
  fps?: number;
  startTime?: number;
  endTime?: number;
  audioBitrate?: string;
  videoBitrate?: string;
  audioCodec?: string;
  videoCodec?: string;
  preset?: string;
  crf?: number;
}

export interface FFmpegStatus {
  isLoaded: boolean;
  isMultiThreaded: boolean;
  version?: string;
  logs: string[];
}

export interface VideoEditorState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  selectedRegion?: {
    start: number;
    end: number;
  };
}

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  fps: number;
  bitrate: number;
  format: string;
  audioCodec?: string;
  videoCodec?: string;
} 
