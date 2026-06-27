import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

function Panel({ title, subtitle, children, onClose }) {
  const startYRef = useRef(0);
  const startSheetYRef = useRef(0);
  const [sheetY, setSheetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const isMobile = () => window.matchMedia('(max-width: 640px)').matches;

  const getExpandedY = () => 0;

  const getMiddleY = () => Math.round(window.innerHeight * 0.42);

  // 아래로 충분히 내리면 최소화하지 않고 패널을 닫아서 지도/순간 남기기 버튼을 완전히 보여줌
  const getCloseY = () => Math.round(window.innerHeight * 0.72);

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  useEffect(() => {
    const resetSheetPosition = () => {
      if (!isMobile()) {
        setSheetY(0);
        return;
      }

      // 모바일 첫 진입 상태: 지도도 보이고 리스트도 보이는 중간 높이
      setSheetY(getMiddleY());
    };

    resetSheetPosition();
    window.addEventListener('resize', resetSheetPosition);

    return () => window.removeEventListener('resize', resetSheetPosition);
  }, []);

  const handlePointerDown = (event) => {
    if (!isMobile()) return;

    setIsDragging(true);
    startYRef.current = event.clientY;
    startSheetYRef.current = sheetY;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!isDragging) return;

    const nextY = startSheetYRef.current + event.clientY - startYRef.current;
    setSheetY(clamp(nextY, getExpandedY(), getCloseY()));
  };

  const handlePointerUp = () => {
    if (!isDragging) return;

    setIsDragging(false);

    const closeY = getCloseY();
    const middleY = getMiddleY();

    // 아래로 충분히 내리면 패널 자체를 닫음
    if (sheetY > middleY + 80) {
      setSheetY(closeY);

      window.setTimeout(() => {
        onClose();
      }, 180);

      return;
    }

    // 위로 많이 올리면 최대화, 아니면 기본 높이로 복귀
    setSheetY(sheetY < middleY * 0.55 ? getExpandedY() : middleY);
  };

  return (
    <section
      className={`panel ${isDragging ? 'dragging' : ''}`}
      style={{ '--sheet-y': `${sheetY}px` }}
    >
      <div
        className="sheetDragArea"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="sheetHandle">
          <span />
        </div>

        <button className="closePanel" onClick={onClose}>
          <X size={18} />
        </button>

        <p>{subtitle}</p>
        <h2>{title}</h2>
      </div>

      <div className="panelBody">{children}</div>
    </section>
  );
}

export default Panel;
