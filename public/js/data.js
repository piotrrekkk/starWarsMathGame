// Game Data, Levels, Lore and Enemy Configurations

const GAME_DATA = {
  crystals: [
    { id: 'blue', name: 'Błękitny Kyber', color: '#00d0ff', glow: 'rgba(0, 208, 255, 0.8)', title: 'Strażnik Świątyni' },
    { id: 'green', name: 'Szmaragdowy Kyber', color: '#25f252', glow: 'rgba(37, 242, 82, 0.8)', title: 'Konsul Jedi' },
    { id: 'purple', name: 'Ametystowy Kyber', color: '#b93bff', glow: 'rgba(185, 59, 255, 0.8)', title: 'Mistrz Mocy' },
    { id: 'gold', name: 'Złoty Kyber', color: '#ffea29', glow: 'rgba(255, 234, 41, 0.8)', title: 'Obrońca Galaktyki' },
    { id: 'red', name: 'Karmazynowy Kyber', color: '#ff2a4b', glow: 'rgba(255, 42, 75, 0.8)', title: 'Wojownik Cienia' }
  ],

  playerDefaultLives: 5,
  enemyDefaultLives: 10,

  levels: [
    {
      id: 1,
      planet: 'Coruscant',
      location: 'Sala Treningowa Świątyni Jedi',
      title: 'Trening Młodzika',
      enemyName: 'Zdalna Sonda Treningowa',
      enemySub: 'Marksman-H (Autonomiczny Droid)',
      enemyType: 'droid',
      style: 'blaster',
      weaponName: 'Blaster Treningowy',
      description: 'Rozwiązuj działania bez pośpiechu. Każda dobra odpowiedź to Twój celny strzał! Błąd oznacza trafienie od sondy.',
      playerLives: 5,
      enemyLives: 10,
      defaultInputMode: 'choices',
      themeColor: '#00d0ff',
      backgroundClass: 'bg-coruscant',
      enemySvg: 'droid-training'
    },
    {
      id: 2,
      planet: 'Tatooine',
      location: 'Pustynne Kaniony Morza Wydm',
      title: 'Zasadzka Droidów Bojowych',
      enemyName: 'Droid Bojowy B1',
      enemySub: 'Oddział Zwiadowczy Federacji',
      enemyType: 'b1-droid',
      style: 'blaster',
      weaponName: 'Karabin Blasterowy E-11',
      description: 'Droidy bojowe nacierają na pustyni. Celuj precyzyjnie matematyką, by rozbić ich szyk!',
      playerLives: 5,
      enemyLives: 10,
      defaultInputMode: 'choices',
      themeColor: '#ff9d00',
      backgroundClass: 'bg-tatooine',
      enemySvg: 'droid-b1'
    },
    {
      id: 3,
      planet: 'Hoth',
      location: 'Lodowe Pustkowia Bazy Echo',
      title: 'Obrona Przełęczy Lodowej',
      enemyName: 'Elitarny Szturmowiec Śnieżny',
      enemySub: 'Ciężka Piechota Imperium',
      enemyType: 'snowtrooper',
      style: 'blaster',
      weaponName: 'Ciężki Blaster & Tarcza Mocy',
      description: 'Wpisuj wyniki na terminalu, aby oddawać celne salwy w pancerz szturmowca!',
      playerLives: 5,
      enemyLives: 10,
      defaultInputMode: 'keyboard',
      themeColor: '#4deeea',
      backgroundClass: 'bg-hoth',
      enemySvg: 'snowtrooper'
    },
    {
      id: 4,
      planet: 'Bespin',
      location: 'Miasto w Chmurach - Korytarz Karbonitowy',
      title: 'Pojedynek z Inkwizytorem',
      enemyName: 'Mroczny Inkwizytor',
      enemySub: 'Uczeń Ciemnej Strony',
      enemyType: 'saber',
      weaponName: 'Świetlny Miecz Oburęczny',
      description: 'Pojedynek na miecze świetlne! Dobre obliczenie to Twój potężny cios klingą, błąd to atak Inkwizytora!',
      playerLives: 5,
      enemyLives: 10,
      defaultInputMode: 'keyboard',
      themeColor: '#ff0055',
      backgroundClass: 'bg-bespin',
      enemySvg: 'inquisitor'
    },
    {
      id: 5,
      planet: 'Gwiazda Śmierci',
      location: 'Sala Tronowa Imperatora',
      title: 'Ostateczne Starcie o Galaktykę',
      enemyName: 'Lord Vader',
      enemySub: 'Mroczny Lord Sithów',
      enemyType: 'vader',
      style: 'saber',
      weaponName: 'Mistrzowski Miecz Świetlny',
      description: 'Ostateczny pojedynek z Lordem Vaderem! 10 żyć wroga do pokonania. Pokaż siłę Mocy i matematyki!',
      playerLives: 5,
      enemyLives: 10,
      defaultInputMode: 'keyboard',
      themeColor: '#ff1744',
      backgroundClass: 'bg-deathstar',
      enemySvg: 'vader'
    }
  ]
};

window.GAME_DATA = GAME_DATA;
