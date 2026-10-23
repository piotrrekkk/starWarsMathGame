# 🌟 Gwiezdna Akademia Matematyki: Ścieżka Jedi

Ekscytująca gra akcji i przygody w klimacie **Star Wars**, stworzona z myślą o dzieciach w wieku ok. 9 lat (klasy 3-4 szkoły podstawowej) do bezstresowej nauki i utrwalania matematyki.

---

## 🚀 Jak uruchomić aplikację?

### 1. Wymagania
- [Node.js](https://nodejs.org/) (wersja 18+)
- Dowolna przeglądarka internetowa (Chrome, Edge, Safari, Firefox)

### 2. Instalacja i start
```bash
# Instalacja zależności
npm install

# Start serwera
npm start
```

Serwer uruchomi się pod adresem:
👉 **`http://localhost:3000`**

Dzięki responsywnemu układowi gra działa na:
- **Komputerach PC / Mac** (sterowanie myszką lub klawiaturą: klawisze `1-5` lub cyfry `0-9` i `Enter`)
- **Tabletach (iPad / Android)** (duże dotykowe panele numeryczne i karty wyboru)
- **Smartfonach**

### 📲 Instalacja jako aplikacja PWA (Progressive Web App)
Gra została w pełni zaimplementowana jako aplikacja **PWA**:
- **Android / Chrome / Edge:** Kliknij przycisk *„📲 Zainstaluj Grę”* w prawym górnym rogu lub opcję *„Zainstaluj aplikację”* w menu przeglądarki.
- **iPad / iPhone (Safari):** Stuknij przycisk Udostępnij ⎋, a następnie wybierz **„Do ekranu początkowego” ➕**.
- **Zalety PWA:** Gra uruchamia się na pełnym ekranie jak natywna aplikacja (bez pasków przeglądarki) i dzięki buforowaniu Service Worker działa również offline!

---

## 🎮 Zasady Rozgrywki (Pojedynek 1 na 1)

1. **Brak limitu czasu i pośpiechu:**
   - Usunięto wszelkie odliczanie i uciekający czas. Dziecko może spokojnie policzyć w pamięci lub na brudnopisie.

2. **Dobra odpowiedź = Twój strzał:**
   - Gdy poprawnie rozwiążesz zadanie, Twój Jedi oddaje strzał z blastera lub wyprowadza cięcie mieczem świetlnym.
   - **Przeciwnik traci 1 życie**. Zyskujesz punkty i ładujesz serię (Combo).

3. **Błędna odpowiedź = Strzał przeciwnika:**
   - W przypadku pomyłki to przeciwnik strzela w Twoją stronę.
   - **Tracisz 1 życie**. Na ekranie na zielono podświetla się poprawny wynik, aby od razu wyciągnąć naukę.

4. **Pula żyć w każdej rundzie:**
   - **Gracz (Jedi):** 5 żyć 💙💙💙💙💙
   - **Przeciwnik:** 10 żyć ❤️ x 10
   - Aby ukończyć misję, musisz 10 razy trafić wroga, zanim stracisz swoje 5 żyć.

5. **Wygodne sterowanie:**
   - Wybór 1 z 5 kart odpowiedzi lub bezpośrednie wpisywanie wyniku z klawiatury fizycznej / ekranowej.
   - Tryb można przełączać w dowolnym momencie przyciskiem na górze ekranu (*„⌨️ Przełącz na: Klawiatura”* / *„🎴 Przełącz na: 5 Kart”*).

---

## 📐 Zakres Matematyczny (0 - 99)

W każdej misji pojawiają się równomiernie wszystkie 4 działania:
- **Dodawanie (`+`)**: w zakresie od 0 do 99 (np. $47 + 38 = 85$)
- **Odejmowanie (`-`)**: wyniki zawsze nieujemne (np. $92 - 45 = 47$)
- **Mnożenie (`×`)**: tabliczka mnożenia i iloczyny do 99 (np. $8 \times 7 = 56$, $12 \times 6 = 72$)
- **Dzielenie (`:`)**: dokładne dzielenie bez reszty w zakresie do 99 (np. $72 : 8 = 9$, $56 : 7 = 8$)

---

## 🌌 Poziomy Przygody i Planety

1. **Poziom 1: Coruscant** – Zdalna Sonda Treningowa Marksman-H (Ostrzał blasterowy)
2. **Poziom 2: Tatooine** – Droid Bojowy B1 (Pustynny ostrzał blasterowy)
3. **Poziom 3: Hoth** – Elitarny Szturmowiec Śnieżny (Ciężki blaster & tarcza)
4. **Poziom 4: Bespin** – Mroczny Inkwizytor (Pojedynek na miecze świetlne)
5. **Poziom 5: Gwiazda Śmierci** – Lord Vader (Mistrzowskie starcie na miecze świetlne)
