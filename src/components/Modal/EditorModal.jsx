import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import './Modal.css';

function EditorModal({ initial, onClose, onSubmit }) {
  const [form, setForm] = useState({
    id: initial.id,
    owner: initial.owner,
    author: initial.author,
    address: initial.address || '',
    message: initial.message || '',
    image: initial.image || '',
    distance: initial.distance,
    createdAt: initial.createdAt,
    likes: initial.likes,
    score: initial.score,
    songs: [
      initial.songs?.[0] || {
        title: '',
        artist: '',
        albumImage: '',
        previewUrl: '',
      },
    ],
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const updateSong = (field, value) => {
    const nextSong = {
      ...form.songs[0],
      [field]: value,
    };

    setForm({
      ...form,
      songs: [nextSong],
    });
  };

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setForm({
      ...form,
      image: imageUrl,
    });

    e.target.value = '';
  };

  const stopCameraStream = (stream) => {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
  };

  const closeCamera = () => {
    stopCameraStream(cameraStream);
    setCameraStream(null);
    setIsCameraOpen(false);
  };

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('이 브라우저에서는 카메라 촬영을 지원하지 않아요.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
        audio: false,
      });

      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch (error) {
      console.error(error);
      alert('카메라를 열 수 없어요. 브라우저 권한을 허용했는지 확인해주세요.');
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, width, height);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92);

    setForm((prev) => ({
      ...prev,
      image: imageDataUrl,
    }));

    closeCamera();
  };

  useEffect(() => {
    if (!isCameraOpen || !cameraStream || !videoRef.current) return;

    videoRef.current.srcObject = cameraStream;
  }, [isCameraOpen, cameraStream]);

  useEffect(() => {
    return () => {
      stopCameraStream(cameraStream);
    };
  }, [cameraStream]);

  const submit = (e) => {
    e.preventDefault();

    const song = form.songs[0];

    const valid =
      form.address.trim() &&
      form.message.trim() &&
      song.title.trim() &&
      song.artist.trim();

    if (!valid) {
      alert('주소, 문구, 노래 1개는 필수예요.');
      return;
    }

    const fallbackAlbumImage =
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80';

    const nextSong = {
      ...song,
      albumImage: song.albumImage || fallbackAlbumImage,
    };

    onSubmit({
      ...form,
      songs: [nextSong],
    });
  };

  return (
    <div className="modalBackdrop">
      <form className="editorModal" onSubmit={submit}>
        <button type="button" className="modalClose" onClick={onClose}>
          <X />
        </button>

        <h2>{form.id ? '여운 수정하기' : '순간 남기기'}</h2>

        <label>주소 *</label>
        <input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="예: 서울 동작구 상도1동"
        />

        <label>문구 *</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="이 장소에 남기고 싶은 문장을 적어주세요."
        />

        <label>대표 이미지 선택</label>
        <div className="uploadButtons">
          <button type="button" className="uploadChoice" onClick={openCamera}>
            <Camera size={18} />
            카메라로 촬영
          </button>

          <label className="uploadChoice">
            앨범/드라이브 선택
            <input type="file" accept="image/*" onChange={handleImageFile} />
          </label>
        </div>

        {form.image && (
          <img
            className="imagePreview"
            src={form.image}
            alt="선택한 대표 이미지"
          />
        )}

        <label>함께 남길 노래 1개 *</label>
        <div className="songInputs">
          <input
            value={form.songs[0].title}
            onChange={(e) => updateSong('title', e.target.value)}
            placeholder="노래 제목"
          />

          <input
            value={form.songs[0].artist}
            onChange={(e) => updateSong('artist', e.target.value)}
            placeholder="가수"
          />

          <input
            value={form.songs[0].albumImage}
            onChange={(e) => updateSong('albumImage', e.target.value)}
            placeholder="앨범 사진 URL 선택"
          />
        </div>

        <button className="submitButton" type="submit">
          저장하기
        </button>
      </form>

      {isCameraOpen && (
        <div className="cameraBackdrop">
          <div className="cameraModal">
            <button
              type="button"
              className="cameraClose"
              onClick={closeCamera}
              aria-label="카메라 닫기"
            >
              <X />
            </button>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="cameraPreview"
            />

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="cameraActions">
              <button type="button" onClick={closeCamera}>
                취소
              </button>
              <button type="button" onClick={takePhoto}>
                촬영하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditorModal;
