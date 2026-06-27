const seedRecords = [
  {
    id: 'r1',
    owner: 'other',
    author: 'moon',
    address: '서울 동작구 상도1동',
    distance: 180,
    createdAt: '2026-06-27T14:10:00',
    message: '비 오는 길에 들으면 마음이 천천히 가라앉는 노래예요.',
    image: '',
    songs: [
      {
        title: '밤편지',
        artist: 'IU',
        albumImage:
          'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
      {
        title: 'Square',
        artist: 'Yerin Baek',
        albumImage:
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
      {
        title: '긴 밤',
        artist: 'Seori',
        albumImage:
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
    ],
    likes: 18,
    score: 91,
  },
  {
    id: 'r2',
    owner: 'other',
    author: 'sol',
    address: '서울 관악구 봉천동',
    distance: 920,
    createdAt: '2026-06-27T12:20:00',
    message: '햇빛이 예뻐서 잠깐 멈춘 자리. 오늘은 이 노래가 잘 맞았어요.',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80',
    songs: [
      {
        title: 'Love Lee',
        artist: 'AKMU',
        albumImage:
          'https://images.unsplash.com/photo-1499415479124-43c32433a620?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
      {
        title: 'Ditto',
        artist: 'NewJeans',
        albumImage:
          'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
      {
        title: 'Hype Boy',
        artist: 'NewJeans',
        albumImage:
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
    ],
    likes: 7,
    score: 74,
  },
  {
    id: 'r3',
    owner: 'me',
    author: '나',
    address: '서울 동작구 흑석동',
    distance: 1320,
    createdAt: '2026-06-26T19:40:00',
    message: '집 가는 버스 기다리면서 남긴 여운.',
    image: '',
    songs: [
      {
        title: '첫 눈',
        artist: 'EXO',
        albumImage:
          'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
      {
        title: 'Event Horizon',
        artist: 'Younha',
        albumImage:
          'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
      {
        title: '그라데이션',
        artist: '10CM',
        albumImage:
          'https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
    ],
    likes: 12,
    score: 88,
  },
];

export default seedRecords;
