// Game Data, Levels, Lore and Enemy Configurations

const GAME_DATA = {
  crystals: [
    { id: 'blue', name: 'Błękitny Kyber', color: '#00d0ff', glow: 'rgba(0, 208, 255, 0.8)', title: 'Strażnik Świątyni' },
    { id: 'green', name: 'Szmaragdowy Kyber', color: '#25f252', glow: 'rgba(37, 242, 82, 0.8)', title: 'Konsul Jedi' },
    { id: 'purple', name: 'Ametystowy Kyber', color: '#b93bff', glow: 'rgba(185, 59, 255, 0.8)', title: 'Mistrz Mocy' },
    { id: 'gold', name: 'Złoty Kyber', color: '#ffea29', glow: 'rgba(255, 234, 41, 0.8)', title: 'Obrońca Galaktyki' },
    { id: 'red', name: 'Karmazynowy Kyber', color: '#ff2a4b', glow: 'rgba(255, 42, 75, 0.8)', title: 'Wojownik Cienia' }
  ],

  levels: [
    {
      id: 1,
      planet: 'Coruscant',
      location: 'Sala Treningowa Świątyni Jedi',
      title: 'Trening Młodzika',
      enemyName: 'Zdalna Sonda Treningowa',
      enemySub: 'Marksman-H (Autonomiczny Droid)',
      enemyType: 'droid',
      style: 'blaster', // Style: Blaster defense (deflect bolts with saber or shield)
      weaponName: 'Blaster Treningowy & Miecz',
      description: 'Ćwicz skupienie! Odbijaj laserowe strzały sondy treningowej i oddawaj celne salwy.',
      timePerQuestion: 16, // Generous time at entry level for 9-year-olds
      enemyHp: 100,
      playerDamage: 25, // 4 successful attacks to win
      enemyDamage: 20,  // 5 failures to defeat
      defaultInputMode: 'choices', // 5 choices by default on level 1
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
      style: 'blaster', // Blaster battle
      weaponName: 'Karabin Blasterowy E-11',
      description: 'Uwaga na dwa słońca i laserowy ostrzał! Zablokuj salwy droida i unieszkodliw jego obwody.',
      timePerQuestion: 13, // Slightly faster
      enemyHp: 120,
      playerDamage: 25,
      enemyDamage: 20,
      defaultInputMode: 'choices', // 5 choices by default on level 2
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
      style: 'blaster', // Heavy blaster & shield
      weaponName: 'Ciężki Blaster & Tarcza Mocy',
      description: 'Zimno przeszywa powietrze! Wpisuj wyniki na terminalu, aby przełamać pancerz szturmowca!',
      timePerQuestion: 11, // Faster
      enemyHp: 140,
      playerDamage: 28,
      enemyDamage: 22,
      defaultInputMode: 'keyboard', // Transitions to keyboard/numpad
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
      enemyType: 'inquisitor',
      style: 'saber', // Lightsaber duel!
      weaponName: 'Świetlny Miecz Oburęczny',
      description: 'Skrzyżuj miecze świetlne! Sparuj błyskawiczne cięcia inkwizytora i wyprowadź ripostę.',
      timePerQuestion: 9, // Fast
      enemyHp: 160,
      playerDamage: 32,
      enemyDamage: 25,
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
      style: 'saber', // Epic master duel!
      weaponName: 'Legendarny Miecz Mistrza Jedi',
      description: 'Największa próba Mocy! Vader atakuje bez litości. Tylko mistrzowska szybkość liczenia ocali galaktykę!',
      timePerQuestion: 7.5, // Reflexes + fast calculations
      enemyHp: 200,
      playerDamage: 35,
      enemyDamage: 30,
      defaultInputMode: 'keyboard',
      themeColor: '#ff1744',
      backgroundClass: 'bg-deathstar',
      enemySvg: 'vader'
    }
  ]
};

window.GAME_DATA = GAME_DATA;
