export const loginCredentials = {
  reader: {
    email: 'reader@komikinaja.com',
    password: 'password123',
    role: 'reader',
    name: 'Pembaca Setia'
  },
  author: {
    email: 'author@komikinaja.com',
    password: 'password123',
    role: 'author',
    name: 'Author Kreatif'
  }
};

export const categories = [
  "ALL", "DRAMA", "FANTASI", "KERAJAAN", "ACTION", "ROMANCE", "SLICE OF LIFE", "HOROR", "THRILLER"
];

// Fallback mangas if API fails
export const mangas = [
  {
    id: 1,
    title: "Solo Leveling",
    episode: "Episode 122",
    likes: "4.120",
    views: "489K",
    cover: "https://placehold.co/400x600/1F2544/FFFFFF/png?text=Solo+Leveling",
    isNew: true
  },
  {
    id: 2,
    title: "Blue Period",
    episode: "Vol 3: Episode 45",
    likes: "4.120",
    views: "489K",
    cover: "https://placehold.co/400x600/1F2544/FFFFFF/png?text=Blue+Period",
    isNew: true
  },
  {
    id: 3,
    title: "Cry, or Better Yet, Beg",
    episode: "Episode 72",
    likes: "4.120",
    views: "489K",
    cover: "https://placehold.co/400x600/1F2544/FFFFFF/png?text=Cry+or+Better+Yet+Beg",
    isNew: false
  },
  {
    id: 4,
    title: "Killer Peter",
    episode: "Episode 402",
    likes: "4.120",
    views: "489K",
    cover: "https://placehold.co/400x600/1F2544/FFFFFF/png?text=Killer+Peter",
    isNew: false
  }
];

export const heroBanner = {
  title: "Selamat datang di KomikinAja, Omniscient Reader's Viewpoint!",
  description: "Cuma aku satu-satunya orang yang tahu akhir dunia ini. Karena satu jalan ceritaku, di sanalah dunia terhenti dan tak berjalan...",
  cover: "https://placehold.co/800x400/1F2544/FFFFFF/png?text=Omniscient+Reader",
  url: "/comic/1"
};

// Dummy episodes for reading mode since API doesn't provide them
export const dummyEpisodes = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  title: `Episode ${i + 1}`,
  likes: "4.120"
}));

// Dummy pages for reading
export const dummyPages = Array.from({ length: 5 }, (_, i) => 
  `https://placehold.co/800x1200/EAE3D2/1F2544/png?text=Page+${i + 1}`
);

// Dummy comments
export const dummyComments = [
  {
    id: 1,
    name: "Naruto Uzumaki",
    avatar: "https://placehold.co/100x100/1F2544/FFFFFF/png?text=NU",
    text: "Gue ngerasa cerita ini nggak sesimpel yang kelihatan di awal. Dari cara karakter utamanya bereaksi di beberapa scene, kayak ada sesuatu yang disembunyiin—entah masa lalu atau tujuan sebenarnya. Terus kalau diperhatiin, detail kecil di background juga sering muncul berulang, mungkin itu foreshadowing buat plot twist gede nanti.",
    time: "6 jam"
  },
  {
    id: 2,
    name: "Marin Kitagawa",
    avatar: "https://placehold.co/100x100/FF5722/FFFFFF/png?text=MK",
    text: "KEREN BGT GILEE GA SABAR LANJUTANNYA",
    time: "1 hari"
  }
];
