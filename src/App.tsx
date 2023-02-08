import {
  Button,
  Container,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import React, { useState, useRef, useEffect } from "react";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import DownloadForOfflineIcon from "@mui/icons-material/DownloadForOffline";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import { cyan, deepPurple, grey, purple, red } from "@mui/material/colors";

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunks: Blob[] = [];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!recordedBlob) {
      return;
    }

    const audio = new Audio();
    audio.src = URL.createObjectURL(recordedBlob);
    audioRef.current = audio;

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) {
      return;
    }

    audioContextRef.current = new AudioContext();
    const source = audioContextRef.current.createMediaElementSource(
      audioRef.current
    );
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyser.connect(audioContextRef.current.destination);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, cyan[300]);
      gradient.addColorStop(1, purple[300]);
      // gradient.addColorStop(1, "blue");

      canvasCtx.fillStyle = gradient;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        // canvasCtx.fillStyle = "#ffa500";
        canvasCtx.fillRect(
          x,
          canvas.height - barHeight / 2,
          barWidth,
          barHeight / 2
        );

        x += barWidth + 1;
      }
    };
    draw();
  }, [recordedBlob]);

  const startRecording = () => {
    if (audioRef.current) audioRef.current.pause();
    setRecordedBlob(null);
    setIsPlaying(false);

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();

      mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
        chunks.push(event.data);
      });

      mediaRecorderRef.current.addEventListener("stop", () => {
        setRecordedBlob(new Blob(chunks, { type: "audio/mpeg" }));
      });

      setIsRecording(true);
    });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.addEventListener("pause", () => {
        setIsPlaying(false);
      });
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
      }
    }
  };

  const downloadAudio = () => {
    if (recordedBlob) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(recordedBlob);
      link.download = "recording.mp3";
      link.click();
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
      }, 100);
    }
  };

  return (
    <Container
      sx={{
        height: "100vh",
        backgroundColor: deepPurple[900],
        margin: 0,
        root: {
          maxWidth: "100%",
        },
      }}
      maxWidth={false}
    >
      <Stack
        direction="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        spacing={1}
      >
        <Typography variant="h3" color={grey[50]}>
          Audio Recorder
        </Typography>
        <canvas ref={canvasRef} width={300} height={100} />
        <Stack direction="row" spacing={1}>
          <Button
            aria-label="start record"
            disabled={isRecording}
            onClick={startRecording}
            sx={{ color: grey[50] }}
            endIcon={<FiberManualRecordIcon sx={{ color: red[500] }} />}
            variant="outlined"
          >
            Start Recording
          </Button>
          <Button
            aria-label="stop record"
            disabled={!isRecording}
            onClick={stopRecording}
            sx={{ color: grey[50] }}
            endIcon={<StopCircleIcon sx={{ color: grey[50] }} />}
            variant="outlined"
          >
            Stop Recording
          </Button>
          <Button
            aria-label="play or pause"
            disabled={!recordedBlob}
            onClick={playAudio}
            sx={{ color: grey[50] }}
            variant="outlined"
            endIcon={
              isRecording || !isPlaying ? (
                <PlayCircleOutlineIcon sx={{ color: grey[50] }} />
              ) : (
                <PauseCircleOutlineIcon sx={{ color: grey[50] }} />
              )
            }
          >
            {isRecording || !isPlaying ? "Play" : "Pause"}
          </Button>
          <IconButton
            aria-label="download"
            disabled={!recordedBlob}
            onClick={downloadAudio}
          >
            <DownloadForOfflineIcon sx={{ color: grey[50] }} />
          </IconButton>
        </Stack>
      </Stack>
    </Container>
  );
};

export default App;
