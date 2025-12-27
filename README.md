# 🎵 Magico Soundboard – Jinglownica

## Co to jest Jinglownica?

**Jinglownica (Magico Soundboard)** to lekka, webowa aplikacja typu *soundboard*, działająca w całości w przeglądarce.  
Umożliwia szybkie odtwarzanie plików audio (jingli, efektów, podkładów) za pomocą kafelkowego interfejsu — bez instalacji, bez kont i bez backendu.

Aplikacja idealnie sprawdzi się podczas:
- audycji radiowych,
- streamów,
- eventów,
- prób zespołów,
- realizacji dźwięku i multimediów.

---

## Funkcje

✅ Wczytywanie własnych plików audio  
✅ Kafelkowy interfejs z regulowanym rozmiarem kafelków  
✅ Odtwarzanie / pauza jednym kliknięciem  
✅ Reset utworu do początku  
✅ Kolorowanie kafelków  
✅ Pasek postępu odtwarzania  
✅ Tryb **crossfade** (płynne przejścia między dźwiękami)  
✅ Lokalny zapis plików i ustawień (IndexedDB)  
✅ Eksport i import ustawień do pliku JSON  
✅ Działanie offline po pierwszym uruchomieniu  

---

## Jak to działa?

1. Użytkownik otwiera aplikację w przeglądarce.
2. Wczytuje pliki audio z komputera.
3. Każdy plik pojawia się jako osobny kafelek.
4. Kliknięcie kafelka rozpoczyna lub zatrzymuje odtwarzanie.
5. W trybie crossfade uruchomienie kolejnego kafelka powoduje płynne przejście dźwięków.
6. Kolory, kolejność i ustawienia są zapisywane lokalnie w przeglądarce.
7. Ustawienia można wyeksportować i zaimportować na innym urządzeniu.

---

## Struktura plików

```
.
.
MAGICO-SOUNDBOARD/
│
├── app.html // Główna aplikacja Jinglownicy
├── app.js // Logika aplikacji (audio, crossfade, IndexedDB)
├── style.css // Style interfejsu
├── index.php // Strona informacyjna / landing
├── index-v2.html // Wariant roboczy / testowy strony startowej
├── README.md // Dokumentacja projektu

```

---


---

## Technologie

- HTML5
- JavaScript (Vanilla)
- Bootstrap
- IndexedDB (lokalne przechowywanie danych)
- Audio API przeglądarki

> Aplikacja **nie wymaga serwera**, bazy danych ani kont użytkowników.

---

## Dane i prywatność

- Wszystkie pliki audio i ustawienia zapisywane są **lokalnie w przeglądarce**
- Dane **nie są wysyłane na żaden serwer**
- Usunięcie danych przeglądarki powoduje usunięcie zapisanych plików

---

## Eksport / import ustawień

- Eksport zapisuje kolory kafelków oraz ustawienia crossfade
- Import dopasowuje ustawienia do plików audio na podstawie nazw plików
- Format pliku: JSON

---

## Możliwe kierunki rozwoju

- Obsługa klawiatury (hotkeys)
- Tryb fullscreen / sceniczny
- Banki / grupy kafelków
- Regulacja głośności per kafelek
- PWA (instalowalna aplikacja)
- Obsługa kontrolerów MIDI

---

## Autorzy

Projekt stworzony przez:

✨ [Magico Software](https://magico.pl)  
🎶 [Zespół Muzyczni.com](https://muzyczni.com)

---

## Licencja

Projekt dostępny na licencji MIT — możesz go dowolnie modyfikować, rozwijać i używać zarówno komercyjnie, jak i prywatnie.

---

## Kontakt

- Magico Software: https://magico.pl  
- Muzyczni.com: https://muzyczni.com



