# 1С·декс

Интерактивный тренажёр встроенного языка 1С в стиле codedex. Короткая теория, редактор с подсказками и интерпретатор BSL, который выполняет код прямо в браузере. Ставить платформу не нужно, всё работает из одного HTML-файла.

**English version below.**

## Что внутри

- 9 глав и 39 уроков: от первого `Сообщить()` до ТаблицыЗначений, процедур и обработки ошибок.
- Глава «Боевые задачи» с задачами, которые реально прилетают 1С-нику на работе: проверка ИНН, номера документов, отчёт через `Свернуть`, распределение доставки без потерянных копеек, списание по FIFO, дебиторка по срокам, зарплата и НДФЛ, поиск дублей контрагентов, проверка заполнения документа, срок оплаты в рабочих днях.
- 7 челленджей, квизы, XP, уровни, комбо, сундуки, задания дня и сертификат.
- Раздел «Мой бизнес»: студия внедрения растёт от гаража до штаб-квартиры с каждым значком.
- Интро, обучение в духе визуальной новеллы, фоновый эмбиент и смена цвета акцента. Есть пасхалка.
- Интерфейс на русском и английском. Переключатель RU / EN в шапке и в профиле. Код в уроках остаётся на русском синтаксисе 1С, как в реальных проектах.

Прогресс хранится в браузере (localStorage). В профиле его можно скачать файлом и загрузить на другом устройстве.

## Запуск

Открой `index.html` в браузере. Или включи GitHub Pages: Settings → Pages → Deploy from a branch → `main` / root.

## Разработка

Исходники лежат в `src/`:

| Файл | Что там |
|---|---|
| `bsl.js` | интерпретатор языка 1С: токенизатор, парсер, вычислитель, коллекции, Формат |
| `content.js` | уроки, челленджи, значки, шпаргалка |
| `content_en.js` | английский перевод курса |
| `i18n_dict.js`, `i18n.js` | словарь интерфейса и переключение языка |
| `app.js` | весь интерфейс: роутер, редактор, бизнес, музыка, обучение |
| `style.css` | стили |
| `index.html` | шаблон, в который всё собирается |

После правок собери файл заново:

```
python3 build.py
```

---

## English

1С·декс is an interactive trainer for the 1C:Enterprise built-in language (BSL), inspired by codedex. Short lessons, an editor with autocomplete and a BSL interpreter that runs your code right in the browser. No platform install, everything lives in a single HTML file.

- 9 chapters, 39 lessons, 7 challenges, quizzes, XP, levels, chests, daily quests and a certificate.
- A "Real work tasks" chapter with problems 1C developers actually get at work: tax ID validation, document numbering, grouped sales reports, cost allocation without lost kopecks, FIFO write-off, receivables aging, payroll with income tax, duplicate counterparties, required fields check and business-day deadlines.
- Russian and English UI, switchable with the RU / EN button. Lesson code stays in Russian 1C syntax, the way real projects are written.

Open `index.html` in a browser, or enable GitHub Pages for the `main` branch. Sources are in `src/`, rebuild with `python3 build.py`.
