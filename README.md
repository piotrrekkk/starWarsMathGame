# 🌟 Gwiezdna Akademia Matematyki: Ścieżka Jedi

Ekscytująca gra akcji i przygody w klimacie **Star Wars**, stworzona z myślą o dzieciach w wieku ok. 9 lat (klasy 3-4 szkoły podstawowej) do nauki i utrwalania matematyki.

---

## 🚀 Jak uruchomić aplikację?

### 1. Wymagania
- [Node.js](https://nodejs.org/) (wersja 18+)
- Przeglądarka internetowa (Chrome, Edge, Safari, Firefox)

### 2. Instalacja i start
W katalogu projektu wykonaj:

```bash
# Instalacja zależności
npm install

# Start serwera
npm start
```

Serwer uruchomi się pod adresem:
👉 **`http://localhost:3000`**

Dzięki responsywnemu układowi gra działa na:
- **Komputerach PC / Mac** (sterowanie myszką lub klawiaturą numeryczną / klawiszami 1-5 oraz cyframi 0-9)
- **Tabletach (iPad / Android)** (duże dotykowe panele numeryczne i karty wyboru)
- **Smartfonach**

Aby zagrać na tablecie w tej samej sieci domowej Wi-Fi, wystarczy w przeglądarce tabletu wpisać `http://<IP-TWOJEGO-KOMPUTERA>:3000`.

---

## 🎮 Zasady Rozgrywki

### 1. Faza Obrony (Wróg atakuje!)
- Gdy przeciwnik (Droid, Szturmowiec lub Lord Sithów) wykonuje strzał z blastera lub cięcie mieczem, na ekranie pojawia się czerwony alarm.
- Twoim zadaniem jest rozwiązać działanie w wyznaczonym czasie.
- **Prawidłowa odpowiedź:** Twój Jedi odbija strzał blasterowy lub paruje miecz świetlny! Brak obrażeń + doładowanie serii (Combo).
- **Zła odpowiedź lub upływ czasu:** Wróg zadaje Ci obrażenia (spadek paska HP).

### 2. Faza Kontrataku (Twój cios!)
- Czas na ripostę! Na ekranie pojawia się kolejne zadanie matematyczne.
- **Prawidłowa odpowiedź:** Wyprowadzasz atak blasterem lub potężne cięcie mieczem świetlnym, zabierając punkty życia wrogowi.
- **Zła odpowiedź lub upływ czasu:** Wróg wykonuje unik, a runda przechodzi z powrotem do obrony.

### 3. Sterowanie i tryby odpowiedzi
- **Poziomy 1 i 2 (Młodzik):** Domyślnie 5 kolorowych kart odpowiedzi (1 poprawna + 4 zmyłkowe). Możesz też używać klawiszy `1` do `5`.
- **Poziomy 3, 4 i 5 (Rycerz i Mistrz Jedi):** Domyślnie bezpośrednie wpisywanie wyniku za pomocą fizycznej klawiatury lub dotykowej klawiatury numerycznej na ekranie (klawisze `0-9`, `⌫ Cofnij`, `✔ Zatwierdź`).
- **Przycisk przełączania:** W dowolnej chwili podczas walki dziecko lub rodzic może przełączyć tryb jednym kliknięciem przycisku na górze ekranu (*„⌨️ Przełącz na: Klawiatura”* / *„🎴 Przełącz na: 5 Kart”*).

---

## 📐 Zakres Matematyczny (0 - 99)

Gra w każdej potyczce równomiernie miksuje wszystkie 4 podstawowe operacje:
1. **Dodawanie (`+`)**: w pełnym zakresie od 0 do 99 (np. $47 + 38 = 85$).
2. **Odejmowanie (`-`)**: wyniki zawsze nieujemne (np. $92 - 45 = 47$).
3. **Mnożenie (`×`)**: tabliczka mnożenia i iloczyny do 99 (np. $8 \times 7 = 56$, $12 \times 6 = 72$).
4. **Dzielenie (`:`)**: dokładne dzielenie bez reszty w zakresie do 99 (np. $72 : 8 = 9$, $56 : 7 = 8$).

---

## 🌌 Poziomy Przygody i Planety

1. **Poziom 1: Coruscant (Sala Treningowa Świątyni)**
   - *Wróg:* Zdalna Sonda Treningowa Marksman-H
   - *Styl:* Ostrzał blasterowy & miecz treningowy
   - *Czas:* Spokojne 16 sekund na zadanie
2. **Poziom 2: Tatooine (Morze Wydm)**
   - *Wróg:* Droid Bojowy B1
   - *Styl:* Karabin blasterowy E-11
   - *Czas:* 13 sekund na zadanie
3. **Poziom 3: Hoth (Baza Echo)**
   - *Wróg:* Elitarny Szturmowiec Śnieżny
   - *Styl:* Ciężki Blaster & Tarcza Mocy
   - *Czas:* 11 sekund na zadanie
4. **Poziom 4: Bespin (Miasto w Chmurach)**
   - *Wróg:* Mroczny Inkwizytor
   - *Styl:* Pojedynek na miecze świetlne (oburęczne parowanie)
   - *Czas:* 9 sekund na zadanie
5. **Poziom 5: Gwiazda Śmierci (Sala Tronowa)**
   - *Wróg:* Lord Vader
   - *Styl:* Mistrzowski pojedynek na miecze świetlne
   - *Czas:* 7.5 sekundy na zadanie

---

## 🎨 Wizualia i Dźwięk
- **Personalizacja:** Wybór Kryształu Kyber (Niebieski, Zielony, Fioletowy, Złoty, Czerwony), który zmienia kolor ostrza miecza oraz efektów świetlnych w grze.
- **Efekty Audio:** Wbudowany syntezator Web Audio API generujący dźwięki mieczy świetlnych (włączanie, świst, starcie kling), blasterów (wystrzał, rykoszet, trafienie) oraz triumfalne fanfary. Brak zewnętrznych plików dźwiękowych gwarantuje zerowe opóźnienia i natychmiastowe działanie w każdej przeglądarce.
