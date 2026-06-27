import { useEffect, useRef, useState } from 'react';
import './MapCanvas.css';

const RADIUS_METER = 500;

function loadKakaoMapScript() {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => resolve(window.kakao));
      return;
    }

    const existingScript = document.getElementById('kakao-map-script');

    if (existingScript) {
      existingScript.addEventListener('load', () => {
        window.kakao.maps.load(() => resolve(window.kakao));
      });
      return;
    }

    const script = document.createElement('script');
    script.id = 'kakao-map-script';
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${
      import.meta.env.VITE_KAKAO_MAP_KEY
    }&autoload=false`;

    script.onload = () => {
      window.kakao.maps.load(() => resolve(window.kakao));
    };

    script.onerror = () => {
      reject(new Error('카카오맵 스크립트를 불러오지 못했습니다.'));
    };

    document.head.appendChild(script);
  });
}

function getDistanceMeter(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (value) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapCanvas() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const centerRef = useRef(null);
  const isReturningRef = useRef(false);
  const toastTimerRef = useRef(null);

  const [message, setMessage] = useState('현재 위치를 확인하는 중입니다...');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (text) => {
    setToastMessage(text);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
    }, 1800);
  };

  useEffect(() => {
    let marker = null;
    let circle = null;

    const initMap = async () => {
      try {
        const kakao = await loadKakaoMapScript();

        if (!navigator.geolocation) {
          setMessage('이 브라우저에서는 현재 위치를 사용할 수 없습니다.');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            const currentLatLng = new kakao.maps.LatLng(lat, lng);
            centerRef.current = {
              lat,
              lng,
              kakaoLatLng: currentLatLng,
            };

            const map = new kakao.maps.Map(mapContainerRef.current, {
              center: currentLatLng,
              level: 4,
            });

            mapRef.current = map;

            marker = new kakao.maps.Marker({
              map,
              position: currentLatLng,
              title: '현재 위치',
            });

            circle = new kakao.maps.Circle({
              map,
              center: currentLatLng,
              radius: RADIUS_METER,
              strokeWeight: 3,
              strokeColor: '#917FC4',
              strokeOpacity: 0.9,
              strokeStyle: 'solid',
              fillColor: '#DCD6EA',
              fillOpacity: 0.28,
            });

            kakao.maps.event.addListener(map, 'dragend', () => {
              if (!centerRef.current || isReturningRef.current) return;

              const mapCenter = map.getCenter();

              const distance = getDistanceMeter(
                centerRef.current.lat,
                centerRef.current.lng,
                mapCenter.getLat(),
                mapCenter.getLng(),
              );

              if (distance > RADIUS_METER) {
                isReturningRef.current = true;
                map.panTo(centerRef.current.kakaoLatLng);

                setTimeout(() => {
                  isReturningRef.current = false;
                }, 500);
              }
            });

            kakao.maps.event.addListener(map, 'zoom_changed', () => {
              const level = map.getLevel();

              // 숫자가 커질수록 더 멀리 보임
              // 500m 서비스라 너무 넓게 못 보게 제한
              if (level > 4) {
                map.setLevel(4);
                showToast('현재 위치 주변 500m까지만 볼 수 있어요.');
              }
            });

            setMessage('');
          },
          (error) => {
            console.error(error);
            setMessage('현재 위치 권한을 허용해야 지도를 볼 수 있습니다.');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          },
        );
      } catch (error) {
        console.error(error);
        setMessage(
          '카카오맵을 불러오지 못했습니다. API 키와 도메인을 확인해주세요.',
        );
      }
    };

    initMap();

    return () => {
      if (marker) marker.setMap(null);
      if (circle) circle.setMap(null);

      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="mapCanvas">
      <div ref={mapContainerRef} className="kakaoMap" />

      {message && <div className="mapMessage">{message}</div>}

      {toastMessage && <div className="mapToast">{toastMessage}</div>}
    </div>
  );
}
