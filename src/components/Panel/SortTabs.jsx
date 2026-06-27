import './SortTabs.css';

const SEASONS = [
  ['SPRING', '봄'],
  ['SUMMER', '여름'],
  ['AUTUMN', '가을'],
  ['WINTER', '겨울'],
];

function SortTabs({ value, onChange, season, onSeasonChange }) {
  const tabs = [
    ['distance', '거리순'],
    ['recommend', '추천순'],
    ['time', '시간순'],
    ['seasonal', '계절순'],
  ];

  return (
    <div>
      <div className="tabs">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            className={value === id ? 'selected' : ''}
            onClick={() => onChange(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {value === 'seasonal' && (
        <div className="seasonTabs">
          {SEASONS.map(([id, label]) => (
            <button
              key={id}
              className={season === id ? 'selected' : ''}
              onClick={() => onSeasonChange(season === id ? null : id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SortTabs;
