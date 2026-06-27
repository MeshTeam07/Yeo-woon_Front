import './SortTabs.css';

function SortTabs({ value, onChange }) {
  const tabs = [
    ['distance', '거리순'],
    ['recommend', '추천순'],
    ['time', '시간순'],
  ];

  return (
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
  );
}

export default SortTabs;
