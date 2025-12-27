<!DOCTYPE html>
<html lang="pl">

<head>
    <meta charset="UTF-8">
    <title>Jinglownica – Prosty Soundboard w Przeglądarce</title>

    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <!-- Bootstrap -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

    <style>
        body {
            background-color: #f8f9fa;
            font-family: Arial, sans-serif;
        }

        .container {
            max-width: 900px;
            margin-top: 60px;
            text-align: center;
        }

        .btn-container {
            margin: 40px 0;
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
        }

        .section {
            margin: 50px 0;
            padding: 30px;
            background-color: #fff;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.08);
            border-radius: 10px;
            text-align: left;
        }

        .section h2 {
            margin-bottom: 20px;
        }

        footer {
            margin: 40px 0 20px;
            font-size: 14px;
            color: #888;
        }

        .icon {
            font-size: 48px;
            margin-bottom: 20px;
            color: #343a40;
        }
    </style>
</head>

<body>

<div class="container">

    <div class="icon">
        <i class="fas fa-music"></i>
    </div>

    <h1 class="mb-3">Jinglownica</h1>
    <p class="lead">
        Prosty soundboard działający w przeglądarce – idealny do radia, streamów, eventów i prób.
    </p>

    <div class="btn-container">
        <a href="app.html" class="btn btn-primary btn-lg">
            <i class="fas fa-play"></i> Uruchom Jinglownicę
        </a>

        <a href="https://github.com/banaczyk" target="_blank" class="btn btn-dark btn-lg">
            <i class="fab fa-github"></i> GitHub
        </a>
    </div>

    <div class="section">
        <h2>Co to jest Jinglownica?</h2>
        <p>
            <strong>Jinglownica</strong> to lekka aplikacja typu <em>soundboard</em>, działająca w całości w przeglądarce.
            Pozwala wczytać pliki audio, przypisać je do kafelków i odtwarzać jednym kliknięciem – bez instalowania
            dodatkowego oprogramowania.
        </p>
        <p>
            Wszystkie dane (pliki audio, kolory kafelków, ustawienia) zapisywane są lokalnie w przeglądarce użytkownika.
        </p>
    </div>

    <div class="section">
        <h2>Najważniejsze funkcje</h2>
        <ul>
            <li>🎵 wczytywanie własnych plików audio</li>
            <li>🧩 kafelkowy interfejs (różne rozmiary kafelków)</li>
            <li>🎨 kolorowanie kafelków</li>
            <li>🔁 reset utworu jednym kliknięciem</li>
            <li>🌊 tryb płynnych przejść (crossfade)</li>
            <li>📊 wizualny pasek postępu</li>
            <li>💾 zapamiętywanie danych w przeglądarce (IndexedDB)</li>
            <li>📤 eksport i import ustawień</li>
        </ul>
    </div>

    <div class="section">
        <h2>Jak korzystać?</h2>
        <ol>
            <li>Uruchom aplikację klikając <strong>„Uruchom Jinglownicę”</strong>.</li>
            <li>Wczytaj pliki audio z komputera.</li>
            <li>Kliknij kafelek, aby rozpocząć odtwarzanie.</li>
            <li>Włącz tryb crossfade, jeśli chcesz płynnych przejść między dźwiękami.</li>
            <li>Dostosuj kolory i rozmiar kafelków do własnych potrzeb.</li>
        </ol>
        <p>
            Jinglownica świetnie sprawdzi się jako narzędzie do jingli radiowych, efektów dźwiękowych,
            streamów, prób zespołów czy wydarzeń na żywo.
        </p>
    </div>

    <div class="section">
        <h2>Technologia</h2>
        <p>
            Aplikacja działa w oparciu o:
        </p>
        <ul>
            <li>HTML5 + JavaScript</li>
            <li>Bootstrap (UI)</li>
            <li>IndexedDB (lokalne przechowywanie danych)</li>
            <li>Audio API przeglądarki</li>
        </ul>
        <p class="mb-0">
            Nie wymaga serwera ani kont użytkowników – wszystko działa lokalnie.
        </p>
    </div>

    <footer>
        © 2025 Jinglownica · Prosty soundboard w przeglądarce
    </footer>

</div>

</body>
</html>
