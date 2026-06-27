import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import './MapCanvas.css';
import MapPin from './MapPin';
import { RADIUS_METER } from '../../constants';
const MAX_LEVEL = 3;

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
    }&autoload=false&libraries=services`;

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

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export default function MapCanvas({
  records = [],
  likes = [],
  onLike,
  onSelect,
  onLocationReady,
}) {
  const onLocationReadyRef = useRef(onLocationReady);
  useEffect(() => {
    onLocationReadyRef.current = onLocationReady;
  }, [onLocationReady]);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const kakaoRef = useRef(null);
  const centerRef = useRef(null);
  const isReturningRef = useRef(false);
  const toastTimerRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const overlayRefs = useRef([]);

  const [message, setMessage] = useState('현재 위치를 확인하는 중입니다...');
  const [toastMessage, setToastMessage] = useState('');
  const [mapReady, setMapReady] = useState(false);

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
    const initMap = async () => {
      try {
        const kakao = await loadKakaoMapScript();
        kakaoRef.current = kakao;

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
              level: MAX_LEVEL - 1,
            });

            mapRef.current = map;

            markerRef.current = new kakao.maps.Marker({
              map,
              position: currentLatLng,
              title: '현재 위치',
            });

            circleRef.current = new kakao.maps.Circle({
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

              if (level > MAX_LEVEL) {
                map.setLevel(MAX_LEVEL);
                showToast(
                  `현재 위치 주변 ${RADIUS_METER}m까지만 볼 수 있어요.`,
                );
              }
            });

            setMessage('');

            try {
              const geocoder = new kakao.maps.services.Geocoder();
              geocoder.coord2Address(lng, lat, (result, status) => {
                let addr = '';
                if (status === kakao.maps.services.Status.OK && result[0]) {
                  const r = result[0];
                  addr =
                    r.road_address?.address_name ||
                    r.address?.address_name ||
                    '';
                }
                onLocationReadyRef.current?.(lat, lng, addr);
                setMapReady(true);
              });
            } catch {
              onLocationReadyRef.current?.(lat, lng, '');
              setMapReady(true);
            }
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
      if (markerRef.current) markerRef.current.setMap(null);
      if (circleRef.current) circleRef.current.setMap(null);

      overlayRefs.current.forEach(({ overlay, root }) => {
        root.unmount();
        overlay.setMap(null);
      });
      overlayRefs.current = [];

      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !kakaoRef.current || !centerRef.current)
      return;

    const kakao = kakaoRef.current;
    const map = mapRef.current;

    overlayRefs.current.forEach(({ overlay, root }) => {
      root.unmount();
      overlay.setMap(null);
    });
    overlayRefs.current = [];

    const drawableRecords = records
      .map((record, index) => {
        const lat = toNumber(record.lat);
        const lng = toNumber(record.lng);

        // 예전 localStorage에 lat/lng 없이 저장된 기록도 임시로 현재 위치 근처에 표시
        if (lat === null || lng === null) {
          return {
            ...record,
            lat: centerRef.current.lat + index * 0.00018,
            lng: centerRef.current.lng + index * 0.00018,
          };
        }

        return { ...record, lat, lng };
      })
      .filter((record) => {
        const distance = getDistanceMeter(
          centerRef.current.lat,
          centerRef.current.lng,
          record.lat,
          record.lng,
        );

        return distance <= RADIUS_METER;
      });

    overlayRefs.current = drawableRecords.map((record) => {
      const container = document.createElement('div');
      container.className = 'customMapPinOverlay';

      container.style.position = 'relative';
      container.style.zIndex = '9999';

      const root = createRoot(container);

      flushSync(() => {
        root.render(
          <MapPin
            record={record}
            liked={likes.includes(record.id)}
            onLike={onLike}
            onSelect={onSelect}
          />,
        );
      });

      const overlay = new kakao.maps.CustomOverlay({
        map,
        position: new kakao.maps.LatLng(record.lat, record.lng),
        content: container,
        yAnchor: 1,
        zIndex: 9999,
      });

      overlay.setZIndex(9999);

      return { overlay, root };
    });
  }, [mapReady, records, likes, onLike, onSelect]);

  return (
    <div className="mapCanvas">
      <div ref={mapContainerRef} className="kakaoMap" />

      {message && <div className="mapMessage">{message}</div>}

      {toastMessage && <div className="mapToast">{toastMessage}</div>}
    </div>
  );
}
