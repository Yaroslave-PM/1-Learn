/* 1С·декс: английский перевод курса. Код остаётся на русском синтаксисе 1С.
   {{N}} в теории подставляет N-й пример кода из русской версии урока. */
var CONTENT_EN = (function () {
  'use strict';
  const tip = (s) => `<div class="callout"><b>Pro tip</b><p>${s}</p></div>`;
  const warn = (s) => `<div class="callout warn"><b>Careful</b><p>${s}</p></div>`;

  const chapters = {
    1: { title: 'First steps', desc: 'Meet the language and write your first code that prints something.' },
    2: { title: 'Variables and types', desc: 'Store data, do the math and glue strings together.' },
    3: { title: 'Conditions', desc: 'If, ElsIf, Else. Your program starts making decisions.' },
    4: { title: 'Loops', desc: 'For, While, Break and Continue. Make the code do the grind for you.' },
    5: { title: 'Collections', desc: 'Array, Structure, Map and the legendary ValueTable.' },
    6: { title: 'Procedures and functions', desc: 'Split code into pieces you can call as many times as you like.' },
    7: { title: 'Strings and errors', desc: 'Cut, glue and format text. Catch exceptions.' },
    8: { title: 'How 1C works', desc: 'Configuration objects, client and server, a first look at queries.' },
    9: { title: 'Real work tasks', desc: 'Tasks straight from the job: tax ID check, FIFO, payroll, duplicates, business days.' }
  };

  const lessons = {
    hello: {
      title: 'Hello, world!',
      theory: `
<p>1C:Enterprise is the platform that runs accounting for a huge number of companies in Russia and nearby countries: bookkeeping, warehouses, payroll, retail. The business logic is written in the <b>1C built-in language</b>, also known as BSL. Its keywords are Russian, so the code reads almost like plain text. English keywords exist too, but in real projects almost everyone writes in Russian, and so will we.</p>
<p>The first command you can't live without is <code>Сообщить()</code>, which means "Message". It prints text to the messages window. You have one on the right, below the editor.</p>
{{1}}
<p>Three rules worth remembering right away:</p>
<ul>
<li>text goes inside <b>double quotes</b>;</li>
<li>every statement ends with a <b>semicolon</b>;</li>
<li>names are case-insensitive: <code>СООБЩИТЬ</code> and <code>сообщить</code> work the same. By convention, though, each word starts with a capital letter.</li>
</ul>
${tip('Run your code with the <b>Run</b> button or <kbd>Ctrl</kbd> + <kbd>Enter</kbd>.')}`,
      tasks: ['Print the text <code>Привет, 1С!</code> ("Hello, 1C!") to the messages window'],
      hint: 'Put a string in double quotes inside the parentheses of Сообщить(). Don\'t forget the semicolon at the end.'
    },
    comments: {
      title: 'Comments and order',
      theory: `
<p>Code runs top to bottom, line by line. Write three <code>Сообщить()</code> calls and you'll see three lines.</p>
<p>Everything after two slashes <code>//</code> is a <b>comment</b>. The interpreter skips it, but it tells people what's going on. In real projects, reading someone else's module without comments hurts.</p>
{{1}}
<p>A long string can span several lines of code. Each continuation line starts with a vertical bar <code>|</code>:</p>
{{2}}`,
      tasks: ['Leave at least one <code>//</code> comment in your code', 'Print three lines in this order: <code>Склад</code>, <code>Касса</code>, <code>Отчёты</code> (Warehouse, Cash desk, Reports)'],
      hint: 'Three Сообщить() calls in a row. Put a comment above them.'
    },
    modules: {
      title: 'Where code lives',
      theory: `
<p>In real 1C, code doesn't sit in one big file. A configuration is made of <b>objects</b> (catalogs, documents, reports), and each one has its own <b>modules</b>:</p>
<ul>
<li>The <b>object module</b> handles the behavior of a single item: what to check before a document is saved, what to do when it's posted.</li>
<li>The <b>manager module</b> holds procedures that belong to the object type as a whole, not to one instance.</li>
<li>The <b>form module</b> handles what happens on screen: button clicks, field changes.</li>
<li>A <b>common module</b> is a library of procedures and functions used all over the configuration.</li>
</ul>
<p>Code is written in the <b>Designer</b> (Конфигуратор) or in <b>1C:Enterprise Development Tools</b> (EDT). Here it's simpler: one module right in your browser.</p>`,
      quiz: [
        { q: 'Where is the best place for a VAT calculation function that a dozen different documents need?', options: ['In the form module of every document', 'In a common module', 'In the object module of one document', 'In a comment'], explain: 'That\'s exactly what common modules are for: write it once, call it from anywhere.' },
        { q: 'Which module handles a button click on screen?', options: ['Form module', 'Manager module', 'Common module', 'Object module'], explain: 'Everything related to the UI and on-screen events lives in the form module.' }
      ]
    },
    vars: {
      title: 'Variables',
      theory: `
<p>A variable is a named box for a value. In 1C you don't have to declare it upfront: it appears the moment you first assign to it.</p>
{{1}}
<p>The <code>=</code> sign here means "put the value into the box". A name can contain letters, digits and underscores, but can't start with a digit. Spaces aren't allowed, so words get glued together: <code>КоличествоТоваров</code> (ItemCount), <code>СуммаДокумента</code> (DocumentTotal).</p>
<p>You can declare a variable explicitly with <code>Перем</code> (Var). Form and object modules do this for module-level variables:</p>
{{2}}
${warn('Read a variable that was never assigned and you get the error <i>Переменная не определена</i> (Variable not defined). The most common beginner mistake.')}`,
      tasks: ['Create a variable <code>Город</code> (City) with the value <code>"Казань"</code>', 'Create a variable <code>Население</code> (Population) with the value <code>1300000</code>', 'Print the value of <code>Город</code>'],
      hint: 'Город = "Казань"; then Население = 1300000; and Сообщить(Город);'
    },
    math: {
      title: 'Arithmetic',
      theory: `
<p>Numbers are added, subtracted, multiplied and divided just like at school: <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>. There's also <code>%</code>, the remainder: <code>7 % 3</code> gives 1. Parentheses change the order of operations.</p>
{{1}}
<p>Now the gotcha everyone trips over: when printing a number, 1C <b>groups the digits</b> with spaces and uses a comma as the decimal separator. <code>Сообщить(1350)</code> shows <b>1 350</b>, and <code>Сообщить(2.5)</code> shows <b>2,5</b>.</p>
<p>To drop the spaces, use <code>Формат()</code> (Format) with the format string <code>ЧГ=0</code> (number grouping off):</p>
{{2}}
${tip('In code, decimals always use a dot: <code>1.5</code>. The comma is only for output.')}`,
      tasks: ['An item costs 450 and 3 were bought. Calculate the variable <code>Сумма</code> (Total)', 'Print <code>Сумма</code> as is (you\'ll see the digit grouping)', 'Print <code>Сумма</code> again, this time through <code>Формат(Сумма, "ЧГ=0")</code>'],
      hint: 'Сумма = Цена * Количество; then two Сообщить calls.'
    },
    strings: {
      title: 'Strings and concatenation',
      theory: `
<p>Strings are glued together with a plus. If the left side is a string and the right side is a number, 1C converts the number to text for you:</p>
{{1}}
<p>Handy little things:</p>
<ul>
<li><code>СтрДлина(Строка)</code> (StrLen) returns the number of characters;</li>
<li><code>Символы.ПС</code> is a line break you can glue into text;</li>
<li>a quote inside a string is written twice: <code>"Фирма ""Ромашка"""</code>.</li>
</ul>
${warn('Order matters! <code>"Итого: " + 5</code> works, but <code>5 + " шт."</code> crashes: the number is on the left, so 1C tries to turn the string into a number. Wrap the number in <code>Строка(5)</code> and it works.')}`,
      tasks: ['Build a string from the variables and print <code>Товар: Кофе, цена: 250 руб.</code>', 'Print the length of the item name using <code>СтрДлина()</code>'],
      hint: 'Сообщить("Товар: " + Товар + ", цена: " + Цена + " руб."); and Сообщить(СтрДлина(Товар));'
    },
    types: {
      title: 'Value types',
      theory: `
<p>Every value in 1C has a type. There are only a few basic, primitive ones:</p>
<ul>
<li><b>Число</b> (Number): <code>42</code>, <code>3.14</code></li>
<li><b>Строка</b> (String): <code>"текст"</code></li>
<li><b>Булево</b> (Boolean): <code>Истина</code> (True) or <code>Ложь</code> (False). When printed it becomes <b>Да</b> and <b>Нет</b> (Yes and No)</li>
<li><b>Дата</b> (Date): a literal in single quotes <code>'20261020'</code></li>
<li><b>Неопределено</b> (Undefined): a value that isn't there</li>
</ul>
<p><code>ТипЗнч()</code> (TypeOf) tells you the type, and you compare it with <code>Тип("TypeName")</code>:</p>
{{1}}
<p>The language is <b>dynamically typed</b>: one variable holds a number today and a string tomorrow. Convenient, but you have to keep an eye on types yourself.</p>`,
      tasks: ['Create a variable <code>Флаг</code> (Flag) with the value <code>Истина</code> and print it (you should get Да)', 'Print the type of the string <code>"1С"</code> using <code>ТипЗнч()</code>'],
      hint: 'Флаг = Истина; Сообщить(Флаг); Сообщить(ТипЗнч("1С"));'
    },
    if: {
      title: 'If... Then',
      theory: `
<p>A condition runs code not always, but only when something is true. <code>Если</code> means If, <code>Тогда</code> means Then:</p>
{{1}}
<p>Comparison operators: <code>=</code> equal, <code>&lt;&gt;</code> not equal, <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code>.</p>
<p>Noticed? In 1C the <code>=</code> sign is both assignment and comparison. The language figures out which one from context: after <code>Если</code> it's always a comparison.</p>
${tip('The block must be closed with <code>КонецЕсли</code> (EndIf). Indenting the inside with a tab makes the code way easier to read.')}`,
      tasks: ['If <code>Остаток</code> (Stock) is less than 20, print <code>Пора дозаказать товар</code> ("Time to reorder")', 'Use the <code>Если ... Тогда ... КонецЕсли</code> construct'],
      hint: 'Если Остаток < 20 Тогда, then Сообщить inside, and КонецЕсли; at the end.'
    },
    elsif: {
      title: 'ElsIf and Else',
      theory: `
<p>When there are more than two options, <code>ИначеЕсли</code> (ElsIf) comes to the rescue. Conditions are checked top to bottom, and the first match wins. <code>Иначе</code> (Else) catches everything that didn't match.</p>
{{1}}
<p>Note that <code>ИначеЕсли</code> is written as one word. A classic typo for people coming from other languages.</p>`,
      tasks: ['Use <code>ИначеЕсли</code>', 'Use <code>Иначе</code> for everything below 50', 'For 90 and up print <code>Отлично</code>, from 70 <code>Хорошо</code>, from 50 <code>Удовлетворительно</code>, otherwise <code>Надо подтянуть</code>. With the current score you should get Хорошо'],
      hint: 'Start with the strictest condition: Если Баллы >= 90 Тогда ... ИначеЕсли Баллы >= 70 Тогда ...'
    },
    logic: {
      title: 'AND, OR, NOT',
      theory: `
<p>Conditions can be combined:</p>
<ul>
<li><code>И</code> (AND): true only if both conditions hold;</li>
<li><code>ИЛИ</code> (OR): one is enough;</li>
<li><code>НЕ</code> (NOT): flips the value.</li>
</ul>
{{1}}
<p>For short forks there's the ternary operator <code>?(Condition, IfTrue, IfFalse)</code>:</p>
{{2}}`,
      tasks: ['If the customer is a regular <b>and</b> the order total is over 5000, print <code>Скидка 10%</code> ("10% off")', 'Otherwise print <code>Без скидки</code> ("No discount")', 'Use the <code>И</code> operator'],
      hint: 'Если ПостоянныйКлиент И СуммаЗаказа > 5000 Тогда ... Иначе ... КонецЕсли;'
    },
    for: {
      title: 'The For loop',
      theory: `
<p>A loop repeats a chunk of code many times. When you know the number of repeats upfront, use <code>Для</code> (For):</p>
{{1}}
<p>The <code>Номер</code> variable goes up by one on every pass: 1, 2, 3. Both bounds are inclusive. The block is closed with <code>КонецЦикла</code> (EndDo).</p>
${tip('Loop counters are often called <code>Сч</code>, <code>Индекс</code> or <code>Н</code>. What matters is that it\'s clear.')}`,
      tasks: ['Use a <code>Для ... По ... Цикл</code> loop', 'Print five lines: <code>Строка 1</code>, <code>Строка 2</code> and so on up to <code>Строка 5</code>'],
      hint: 'Для Сч = 1 По 5 Цикл Сообщить("Строка " + Сч); КонецЦикла;'
    },
    while: {
      title: 'The While loop',
      theory: `
<p><code>Пока</code> (While) keeps spinning as long as the condition is true. Good for when you don't know the number of repeats upfront:</p>
{{1}}
${warn('If the condition never becomes false, the loop runs forever. In real 1C that\'s a freeze; our interpreter just stops and shows an error.')}`,
      tasks: ['A 1000 ruble deposit grows 20% a month. Use <code>Пока</code> to count how many months it takes to reach at least 2000', 'Print <code>Удвоится через 4 мес.</code> ("Doubles in 4 months"; the number must come from the calculation)'],
      hint: 'Пока Баланс < 2000 Цикл: Баланс = Баланс * 1.2; Месяцев = Месяцев + 1; КонецЦикла. Then print.'
    },
    break: {
      title: 'Break and Continue',
      theory: `
<p>Two magic words for controlling a loop:</p>
<ul>
<li><code>Прервать</code> (Break) exits the loop immediately;</li>
<li><code>Продолжить</code> (Continue) skips the rest of the current pass and jumps to the next one.</li>
</ul>
{{1}}
<p>The classic even check: <code>Сч % 2 = 0</code> means the number divides by 2 with no remainder.</p>`,
      tasks: ['Loop from 1 to 10 and print only the odd numbers', 'Skip the even ones with <code>Продолжить</code>'],
      hint: 'Inside the loop: Если Сч % 2 = 0 Тогда Продолжить; КонецЕсли; and below it Сообщить(Сч);'
    },
    fizzbuzz: {
      title: 'Checkpoint: FizzBuzz',
      theory: `
<p>Time to put it all together. FizzBuzz is the interview puzzle they give all over the world, and 1C is no exception. Here it's spelled ФизБаз.</p>
<p>The rules are simple. Go through numbers 1 to 15:</p>
<ul>
<li>if a number divides by both 3 and 5, print <b>ФизБаз</b>;</li>
<li>if only by 3, print <b>Физ</b>;</li>
<li>if only by 5, print <b>Баз</b>;</li>
<li>otherwise print the number itself.</li>
</ul>
${tip('Put the "both 3 and 5" check first. Otherwise it never gets its turn.')}`,
      tasks: ['Use a loop and conditions with <code>%</code>', 'Print exactly 15 lines following the FizzBuzz rules'],
      hint: 'Если Сч % 15 = 0 Тогда ФизБаз; ИначеЕсли Сч % 3 = 0 Тогда Физ; ИначеЕсли Сч % 5 = 0 Тогда Баз; Иначе the number itself.'
    },
    array: {
      title: 'Array',
      theory: `
<p>An array is an ordered list of values. You create it with <code>Новый</code> (New):</p>
{{1}}
<p>The key thing to remember: <b>indexes start at zero</b>. The first element is <code>[0]</code>, the last one is <code>[Количество() - 1]</code>.</p>
<p>Useful methods: <code>Добавить()</code> (Add), <code>Вставить(Index, Value)</code> (Insert), <code>Удалить(Index)</code> (Delete), <code>Найти(Value)</code> (Find), <code>Количество()</code> (Count), <code>Очистить()</code> (Clear).</p>`,
      tasks: ['Create an array <code>Города</code> (Cities)', 'Add <code>Москва</code>, <code>Казань</code> and <code>Сочи</code> to it', 'Print the number of elements', 'Print the first element of the array'],
      hint: 'Города = Новый Массив; then Города.Добавить(...) three times; Сообщить(Города.Количество()); Сообщить(Города[0]);'
    },
    foreach: {
      title: 'For Each',
      theory: `
<p>You can walk a collection by index, but 1C has a nicer loop for that, <code>Для Каждого ... Из</code> (For Each ... In):</p>
{{1}}
<p>The <code>Фрукт</code> variable gets the next element on every pass. No indexes, no going out of bounds.</p>
<p>A classic task: add up all the elements. Create an accumulator variable before the loop and add to it inside.</p>`,
      tasks: ['Use a <code>Для Каждого</code> loop', 'Add up all the prices and print <code>Итого: 1 750</code>'],
      hint: 'Итого = 0; Для Каждого Цена Из Цены Цикл Итого = Итого + Цена; КонецЦикла; Сообщить("Итого: " + Итого);'
    },
    struct: {
      title: 'Structure',
      theory: `
<p>A structure (Структура) stores key and value pairs, where the key is a name like a variable's. Fields are accessed with a dot:</p>
{{1}}
<p>Structures are everywhere in 1C: pass a bundle of parameters to a function, return several values at once, collect settings.</p>
${warn('You can\'t assign a nonexistent field with a dot: you\'ll get <i>Поле объекта не обнаружено</i> (Object field not found). New fields are added only with <code>Вставить()</code>.')}`,
      tasks: ['Create a structure <code>Товар</code> (Item) with fields <code>Наименование</code> = "Чай" and <code>Цена</code> = 300', 'Add the field <code>Остаток</code> = 12 using <code>Вставить()</code>', 'Print <code>Чай: 300 руб., остаток 12</code>, building it from the structure fields'],
      hint: 'Товар = Новый Структура("Наименование, Цена", "Чай", 300); Товар.Вставить("Остаток", 12);'
    },
    map: {
      title: 'Map',
      theory: `
<p>A map (Соответствие) is like a structure, but the key can be anything: a string with spaces, a number, a date, even another object. It's a pure dictionary.</p>
{{1}}
<p>You walk it with <code>Для Каждого</code>, and the element is special, a <b>КлючИЗначение</b> (KeyAndValue):</p>
{{2}}`,
      tasks: ['Count how many times each fruit appears using a <code>Соответствие</code>', 'Print the result in order of first appearance: <code>Яблоко: 3</code>, <code>Груша: 1</code>, <code>Слива: 1</code>'],
      hint: 'In a loop over Фрукты: if Счётчик[Фрукт] = Неопределено, set 1, otherwise add 1. Then a second loop over Счётчик.'
    },
    vtable: {
      title: 'ValueTable',
      theory: `
<p>And here's the star of 1C. A <b>ТаблицаЗначений</b> (ValueTable) is an in-memory table: named columns and rows of data. Database query results are most often turned into one.</p>
{{1}}
<p>Methods you'll use all the time:</p>
<ul>
<li><code>Итог("Column")</code> (Total) sums a column;</li>
<li><code>Сортировать("Цена Убыв")</code> (Sort) sorts, "Убыв" means descending; several columns go comma-separated;</li>
<li><code>Найти(Value, "Column")</code> (Find) returns the first matching row;</li>
<li><code>ВыгрузитьКолонку("Товар")</code> (UnloadColumn) dumps a whole column into an array;</li>
<li><code>Таблица[0]</code> gets a row by index, also zero-based.</li>
</ul>`,
      tasks: ['Create a table <code>Склад</code> (Warehouse) with columns <code>Товар</code> and <code>Количество</code>', 'Add three rows: Ручка 5, Блокнот 3, Степлер 4', 'Print <code>Всего: 12</code>, calculated with <code>Итог()</code>', 'Sort by quantity descending and print the item from the first row'],
      hint: 'After Склад.Сортировать("Количество Убыв") the first row is Склад[0], and its item is Склад[0].Товар.'
    },
    proc: {
      title: 'Procedures',
      theory: `
<p>A procedure (Процедура) is a named chunk of code you can call as many times as you want. You can pass it parameters:</p>
{{1}}
<p>1C modules follow a strict order: variable declarations first, then procedures and functions, and only at the very end the main code. We'll put procedures on top too.</p>
${tip('A good procedure name starts with a verb: <code>ЗаполнитьТаблицу</code> (FillTable), <code>ПроверитьОстатки</code> (CheckStock), <code>ОтправитьПисьмо</code> (SendEmail).')}`,
      tasks: ['Declare a procedure <code>Поприветствовать(Имя)</code> (Greet) that prints <code>Привет, Имя!</code>', 'Call it for <code>Анна</code> and for <code>Олег</code>'],
      hint: 'Процедура Поприветствовать(Имя) Сообщить("Привет, " + Имя + "!"); КонецПроцедуры'
    },
    func: {
      title: 'Functions and Return',
      theory: `
<p>A function (Функция) differs from a procedure in one way: it <b>returns a value</b> with <code>Возврат</code> (Return). That's why you can use it inside expressions.</p>
{{1}}
<p>Return ends the function right away, so code after it won't run. Handy for early exits from checks.</p>
${warn('You can\'t call a procedure where a value is expected. If you need a result, write a function.')}`,
      tasks: ['Write a function <code>СуммаСНДС(Сумма)</code> that returns the amount with 22% VAT (multiply by 1.22)', 'Print <code>СуммаСНДС(1000)</code>', 'Print <code>СуммаСНДС(2500)</code>'],
      hint: 'Функция СуммаСНДС(Сумма) Возврат Сумма * 1.22; КонецФункции. Then two Сообщить calls.'
    },
    params: {
      title: 'Default parameters',
      theory: `
<p>A parameter can have a default value. Then you can skip it when calling:</p>
{{1}}
<p>One more 1C quirk: parameters are passed <b>by reference</b> by default. If the function changes a parameter, the variable you passed in changes too. To prevent that, put <code>Знач</code> (Val) before the parameter:</p>
{{2}}`,
      tasks: ['Write a function <code>Скидка(Сумма, Процент = 5)</code> (Discount) that returns the amount minus the percentage', 'Print <code>Скидка(1000)</code>, it should be 950', 'Print <code>Скидка(1000, 20)</code>, it should be 800'],
      hint: 'Возврат Сумма - Сумма * Процент / 100;'
    },
    kassa: {
      title: 'Checkpoint: Cash register',
      theory: `
<p>Let's build a mini cash register. There are items in the cart; you need to total the receipt and apply a discount.</p>
<p>The store rule: if the purchase is <b>over 3000</b>, give <b>10%</b> off.</p>
<p>The cart is already filled in the starter code. Your job is to write a function that takes the table, calculates <code>Цена * Количество</code> (price times quantity) for every row, sums it up and applies the discount.</p>
${tip('The decimal part will be printed with a comma, that\'s fine. That\'s just how 1C works.')}`,
      tasks: ['Declare a function <code>СуммаЧека(Корзина)</code> (ReceiptTotal)', 'Inside, walk the cart rows with a <code>Для Каждого</code> loop', 'If the total is over 3000, apply a 10% discount', 'Print <code>К оплате: 2 974,5</code> ("To pay")'],
      hint: 'Сумма = 0; Для Каждого Позиция Из Корзина Цикл Сумма = Сумма + Позиция.Цена * Позиция.Количество; КонецЦикла; Если Сумма > 3000 Тогда Сумма = Сумма * 0.9; КонецЕсли; Возврат Сумма;'
    },
    strfn: {
      title: 'String functions',
      theory: `
<p>1C has a pretty rich set of text functions:</p>
<ul>
<li><code>ВРег()</code>, <code>НРег()</code>, <code>ТРег()</code> change case: all upper, all lower, each word capitalized;</li>
<li><code>СокрЛП()</code> trims spaces on both ends;</li>
<li><code>Лев(Str, N)</code>, <code>Прав(Str, N)</code>, <code>Сред(Str, Start, Length)</code> cut out pieces: left, right, middle;</li>
<li><code>СтрНайти(Str, Substring)</code> returns the position of a substring, counting from 1. Returns 0 if not found;</li>
<li><code>СтрЗаменить(Str, What, With)</code> replaces all occurrences.</li>
</ul>
{{1}}
${tip('Unlike arrays, string positions start at one. Yes, it\'s a bit confusing.')}`,
      tasks: ['Trim the extra spaces and capitalize each word, print <code>Иванов Иван Иванович</code>', 'Cut out the last name (everything before the first space) and print it in upper case: <code>ИВАНОВ</code>'],
      hint: 'Красиво = ТРег(СокрЛП(ФИО)); Фамилия = Лев(Красиво, СтрНайти(Красиво, " ") - 1);'
    },
    split: {
      title: 'Split and join',
      theory: `
<p>Two twin functions:</p>
<ul>
<li><code>СтрРазделить(String, Separator)</code> (StrSplit) cuts a string into an array;</li>
<li><code>СтрСоединить(Array, Separator)</code> (StrConcat) glues an array back into a string.</li>
</ul>
{{1}}
<p>For templates there's <code>СтрШаблон</code> (StrTemplate): it puts parameters in place of <code>%1</code>, <code>%2</code> and so on. Reads much nicer than a garland of pluses:</p>
{{2}}
${warn('The trick with СтрРазделить: each separator character works on its own. The separator <code>", "</code> splits by both the comma and the space.')}`,
      tasks: ['Split the route into an array of cities', 'Print each city with its number: <code>1. Москва</code>, <code>2. Казань</code>, <code>3. Екатеринбург</code>', 'Join the cities back with <code> → </code> and print <code>Москва → Казань → Екатеринбург</code>'],
      hint: 'Города = СтрРазделить(Маршрут, ";"); loop Для Сч = 0 По Города.Количество() - 1 and СтрСоединить(Города, " → ")'
    },
    try: {
      title: 'Try and Except',
      theory: `
<p>Errors happen: division by zero, lost connection to the server, broken data. To keep the whole program from crashing, risky code is wrapped in <code>Попытка</code> (Try):</p>
{{1}}
<p>If something breaks inside <code>Попытка</code>, execution jumps straight to the <code>Исключение</code> (Except) block. The <code>ОписаниеОшибки()</code> (ErrorDescription) function returns the error text.</p>
<p>You can also throw an error yourself with <code>ВызватьИсключение "Text"</code> (Raise). That's what you do when the data is clearly wrong and there's no point going on.</p>`,
      tasks: ['Inside <code>Попытка</code>, divide 10 by 0', 'In the <code>Исключение</code> block, print a line that starts with <code>Ошибка: </code> ("Error: ") and contains the error description'],
      hint: 'Попытка Х = 10 / Делитель; Исключение Сообщить("Ошибка: " + ОписаниеОшибки()); КонецПопытки;'
    },
    objects: {
      title: 'Catalogs, documents, registers',
      theory: `
<p>Almost any accounting task in 1C is built from three bricks:</p>
<ul>
<li>A <b>catalog</b> (Справочник) stores lists: products, counterparties, employees, warehouses. It's what "exists".</li>
<li>A <b>document</b> (Документ) records an event: goods receipt, sale, transfer. It's what "happened".</li>
<li>A <b>register</b> (Регистр) stores totals in a report-friendly shape. An accumulation register collects balances and turnovers, an information register keeps facts like exchange rates or prices.</li>
</ul>
<p>When a document is <b>posted</b>, it writes records to registers. Then a report reads balances from the register in a second instead of going through thousands of documents.</p>`,
      quiz: [
        { q: 'Where do records go so you can quickly get the stock balance in a warehouse?', options: ['Into the Products catalog', 'Into the Goods Receipt document', 'Into an accumulation register', 'Into an enumeration'], explain: 'An accumulation register collects receipts and expenses and gives you balances instantly.' },
        { q: 'Where is the list of counterparties stored?', options: ['In a document', 'In a catalog', 'In an information register', 'In a common module'], explain: 'Counterparties are something that "exists", so it\'s a catalog.' }
      ]
    },
    clientserver: {
      title: 'Client and server',
      theory: `
<p>Modern 1C runs as a <b>managed application</b>: the UI runs on the client (in a browser or thin client), and the data lives on the server. That's why procedures in a form module have <b>compilation directives</b>:</p>
{{1}}
<ul>
<li><code>&amp;НаКлиенте</code> (AtClient) runs on the user's machine and doesn't touch the database directly;</li>
<li><code>&amp;НаСервере</code> (AtServer) has access to the database and all objects;</li>
<li><code>&amp;НаСервереБезКонтекста</code> (AtServerNoContext) runs on the server but without the form data, so the call is faster.</li>
</ul>
${tip('Every server call from the client is a trip over the network. Experienced 1C devs try to make as few as possible.')}`,
      quiz: [
        { q: 'A procedure with which directive can read data from the database?', options: ['&НаКлиенте', '&НаСервере', 'Any, it doesn\'t matter', 'Only in a common module'], explain: 'Database access exists only on the server. From the client you have to call a server procedure.' },
        { q: 'Why do developers try to make fewer server calls from the client?', options: ['The server charges per call', 'Every call is a network round trip that slows down the UI', 'The license requires it', 'The client can\'t call the server more than once'], explain: 'The network is slower than memory. Ten small calls are almost always worse than one big one.' }
      ]
    },
    query: {
      title: 'Query language',
      theory: `
<p>The right way to read data from a 1C database is with <b>queries</b>. The query language looks like SQL, only in Russian: ВЫБРАТЬ is SELECT, ИЗ is FROM, ГДЕ is WHERE, УПОРЯДОЧИТЬ ПО is ORDER BY.</p>
{{1}}
<p>See anything familiar? A multiline string with <code>|</code>, and the result is unloaded into a ValueTable, which you already know how to handle. Parameters are passed as <code>&amp;Name</code>: safer and faster than gluing values into the text.</p>
<p>Our sandbox has no database connected, so this example won't run. We'll go through queries on a trainer in the next course.</p>`,
      quiz: [
        { q: 'What does ВЫБРАТЬ Наименование ИЗ Справочник.Номенклатура ГДЕ ЭтоГруппа = ЛОЖЬ return?', options: ['Only product groups', 'Names of all products except groups', 'One random product', 'An error'], explain: 'The condition ЭтоГруппа = ЛОЖЬ (IsFolder = FALSE) cuts out folder groups and keeps regular items.' },
        { q: 'What\'s the right way to pass a value into a query?', options: ['Glue it into the string with a plus', 'Through a &Name parameter and УстановитьПараметр()', 'Through a global variable', 'You can\'t, queries don\'t take values'], explain: 'Parameters protect against errors and let the platform cache the query plan.' }
      ]
    },
    'job-inn': {
      title: 'Tax ID check',
      theory: `
<p>The first task from accounting almost always sounds like this: "someone entered a counterparty with a broken INN again, and the bank bounced the payment". INN is the Russian taxpayer ID. The fix is to validate its check digit right when the catalog item is saved.</p>
<p>A company INN has 10 digits, and the last one is the check digit. Here's how it's calculated:</p>
<ul>
<li>the first nine digits are multiplied by the weights <code>2, 4, 10, 3, 5, 9, 4, 6, 8</code>;</li>
<li>the products are added up;</li>
<li>the check digit equals <code>(Sum % 11) % 10</code>.</li>
</ul>
{{1}}
${tip('In standard configurations this check lives in a common module and is called from the ОбработкаПроверкиЗаполнения (FillCheckProcessing) handler of the Counterparties catalog.')}`,
      tasks: ['A function <code>ИННКорректен</code> checks the length, that all characters are digits, and the check digit via <code>% 11</code>', 'Print <code>7707083893: верный</code> (valid), <code>7707083894: ошибка</code> (error), <code>77070838: ошибка</code>'],
      hint: 'Веса = СтрРазделить("2,4,10,3,5,9,4,6,8", ","). In a loop Для Сч = 1 По 9: Сумма = Сумма + Число(Сред(ИНН, Сч, 1)) * Число(Веса[Сч - 1]). At the end compare (Сумма % 11) % 10 with Число(Прав(ИНН, 1)).'
    },
    'job-docnum': {
      title: 'Document number',
      theory: `
<p>1C documents are numbered with a prefix and leading zeros: <b>ПТ-000042</b>. The prefix usually stands for the company or the document type. No need to build such numbers by hand in a loop, <code>Формат()</code> has everything:</p>
<ul>
<li><code>ЧЦ=6</code> total number of digits;</li>
<li><code>ЧВН=</code> print leading zeros (the value is empty, the key itself is what counts);</li>
<li><code>ЧГ=0</code> no digit grouping.</li>
</ul>
{{1}}
${warn('Without <code>ЧГ=0</code> the number 001 305 gets split with a space, and the bank won\'t accept such a document.')}`,
      tasks: ['Use <code>Формат</code> with <code>ЧВН</code>', 'For the numbers 7, 42 and 1305 print <code>ПТ-000007</code>, <code>ПТ-000042</code>, <code>ПТ-001305</code>'],
      hint: 'Для Каждого Н Из Номера Цикл Сообщить("ПТ-" + Формат(Н, "ЧЦ=6; ЧВН=; ЧГ=0")); КонецЦикла;'
    },
    'job-collapse': {
      title: 'Sales by manager',
      theory: `
<p>The head of sales asks: "show me who sold how much this month, leaders on top". The data comes row by row, one per sale. The table method <code>Свернуть</code> (GroupBy) groups it for you:</p>
{{1}}
<p>After grouping, only the listed columns stay in the table. The rest, like <code>Клиент</code>, disappear: their values differ within a group and can't be summed.</p>
${tip('In a real database such reports are built with a query using ГРУППИРОВАТЬ ПО (GROUP BY). But Свернуть is needed all the time when the data is already in a ValueTable.')}`,
      tasks: ['Group the table by manager with a sum using <code>Свернуть</code>', 'Sort descending and print <code>Анна: 182 000</code>, <code>Олег: 141 500</code>, <code>Ирина: 98 000</code>'],
      hint: 'Продажи.Свернуть("Менеджер", "Сумма"); Продажи.Сортировать("Сумма Убыв"); then Для Каждого and Сообщить(Стр.Менеджер + ": " + Стр.Сумма).'
    },
    'job-split': {
      title: 'Allocating delivery cost',
      theory: `
<p>An accounting classic: a 1000 ruble delivery invoice arrives, and it has to be spread over the goods in proportion to their cost, so the cost price comes out right.</p>
<p>The catch is in the kopecks. Each share is rounded to two decimals, and the sum of rounded shares almost never matches the original: you get 999.99 or 1000.01. The accountant will find that kopeck, guaranteed.</p>
<p>The standard trick:</p>
<ul>
<li>calculate each row's share and round it: <code>Окр(Доставка * Стр.Сумма / Всего, 2)</code>;</li>
<li>remember the row with the largest amount;</li>
<li>add the difference between the original amount and the sum of shares to that row.</li>
</ul>
${tip('Standard configurations have a РаспределитьСуммуПропорционально (DistributeProportionally) function in a common module for this. But at interviews they often ask you to write it by hand.')}`,
      tasks: ['Add a <code>Доставка</code> (Delivery) column and allocate 1000 rubles, rounding with <code>Окр</code>', 'Give the kopeck difference to the row with the largest amount', 'Print <code>Ручки: 163,27</code>, <code>Бумага: 462,58</code>, <code>Папки: 374,15</code>, <code>Итого: 1 000</code>'],
      hint: 'Всего = Товары.Итог("Сумма"). In the loop: Стр.Доставка = Окр(Доставка * Стр.Сумма / Всего, 2); Распределено = Распределено + Стр.Доставка; remember the row with the max Сумма. After the loop: МаксСтрока.Доставка = МаксСтрока.Доставка + (Доставка - Распределено).'
    },
    'job-fifo': {
      title: 'FIFO write-off',
      theory: `
<p>12 pens were sold from the warehouse. What's their cost if the pens were bought in three batches at different prices? Under FIFO, the oldest batches are written off first.</p>
<p>The algorithm:</p>
<ul>
<li>sort the batches by date;</li>
<li>walk them until the required quantity is written off;</li>
<li>take <code>Мин(Осталось, Стр.Количество)</code> from each batch;</li>
<li>accumulate the cost as quantity times the batch price.</li>
</ul>
{{1}}
${tip('In UT and ERP, batch write-off has long been handled by the cost engine. But you need to understand FIFO to explain to the accountant where a number came from.')}`,
      tasks: ['Sort the batches by date and write off 12 units by FIFO using <code>Мин</code>', 'Print <code>Себестоимость: 1 340</code> (Cost) and the batch balances on one line <code>Остатки: 0, 3, 8</code>'],
      hint: 'Партии.Сортировать("Дата"); Осталось = Списать; in a Для Каждого loop: if Осталось = 0, Прервать; Взять = Мин(Осталось, Партия.Количество)... Collect the balances in an array and print with СтрСоединить(Массив, ", ").'
    },
    'job-aging': {
      title: 'Receivables aging',
      theory: `
<p>The CFO wants to see how much customers owe us and for how long. Debts are sorted into buckets: up to 30 days, 31 to 60, over 60. The older the debt, the lower the chance of getting it back.</p>
<p>Subtracting two dates in 1C gives the number of <b>seconds</b>. To get days, divide by 86,400 and drop the fraction:</p>
{{1}}
${warn('Don\'t mix it up with ДобавитьМесяц (AddMonth): adding to a date adds seconds, so "plus one day" in 1C is written as Дата + 86400.')}`,
      tasks: ['Calculate each invoice\'s age in days by dividing by <code>86400</code>', 'Print three lines: <code>До 30 дней: 15 000</code>, <code>31-60 дней: 8 000</code>, <code>Больше 60 дней: 12 000</code>'],
      hint: 'Make three accumulator variables. In the loop: Дней = Цел((ДатаОтчета - Стр.Дата) / 86400); Если Дней <= 30 ... ИначеЕсли Дней <= 60 ... Иначе ...'
    },
    'job-salary': {
      title: 'Payroll and income tax',
      theory: `
<p>An employee with a 90,000 salary worked 19 of 22 days and gets a 15% bonus. HR asks why the payslip shows these numbers. The calculation order:</p>
<ul>
<li>salary part: <code>Окр(Оклад * Отработано / Норма, 2)</code>;</li>
<li>bonus: 15% of the salary part, also rounded to kopecks;</li>
<li>НДФЛ (personal income tax) of 13% is calculated on the total and <b>rounded to whole rubles</b>: <code>Окр(Начислено * 0.13, 0)</code>;</li>
<li>net pay: accrued minus tax.</li>
</ul>
${warn('Rounding income tax to the ruble is required by the Tax Code. Forget it and the tax office will send you a demand.')}`,
      tasks: ['Calculate the accrual, bonus and income tax with correct rounding using <code>Окр</code>', 'Print <code>Начислено: 89 386,36</code> (Accrued), <code>НДФЛ: 11 620</code>, <code>К выплате: 77 766,36</code> (Net pay)'],
      hint: 'ПоОкладу = Окр(Оклад * Отработано / Норма, 2); Премия = Окр(ПоОкладу * ПроцентПремии / 100, 2); Начислено = ПоОкладу + Премия; НДФЛ = Окр(Начислено * 0.13, 0);'
    },
    'job-dupes': {
      title: 'Duplicate counterparties',
      theory: `
<p>Over the years, duplicates pile up in the counterparty catalog: «ООО Ромашка», «ооо "Ромашка"», «ООО  Ромашка» with two spaces. Sales reports lie because of it. The first cleanup step is to find suspicious pairs.</p>
<p>To do that, bring each name to one canonical form:</p>
<ul>
<li><code>НРег</code> removes case differences;</li>
<li><code>СтрЗаменить</code> strips out the quotes;</li>
<li>double spaces get collapsed in a loop <code>Пока СтрНайти(Имя, "  ") > 0</code>;</li>
<li><code>СокрЛП</code> trims the ends.</li>
</ul>
<p>Then count identical keys with a <code>Соответствие</code>.</p>
${tip('A quote inside a 1C string is written twice: "ООО ""Лютик""".')}`,
      tasks: ['Normalize the names and count repeats using a <code>Соответствие</code>', 'Print only the duplicates in order of appearance: <code>ооо ромашка: 3</code>, <code>ип иванов: 2</code>'],
      hint: 'Function Ключ(Имя): Имя = НРег(СтрЗаменить(Имя, """", "")); Пока СтрНайти(Имя, "  ") > 0 Цикл Имя = СтрЗаменить(Имя, "  ", " "); КонецЦикла; Возврат СокрЛП(Имя). Then a key → count map and print those above 1.'
    },
    'job-check': {
      title: 'Required fields check',
      theory: `
<p>Users keep trying to post a document without picking a warehouse or a counterparty. That's why every document has an <b>ОбработкаПроверкиЗаполнения</b> (FillCheckProcessing) handler. It collects all the errors at once instead of stopping at the first one, so the user fixes everything in one go.</p>
<p>Emptiness is checked universally with <code>ЗначениеЗаполнено</code> (ValueIsFilled). For it, an empty string, 0 and <code>Неопределено</code> are all empty.</p>
{{1}}
${tip('In real 1C, required fields are more often marked with the ПроверкаЗаполнения = ВыдаватьОшибку property, and code is written for the tricky conditions.')}`,
      tasks: ['Write a function <code>ПроверитьЗаполнение(Документ, Обязательные)</code> that returns an <code>Массив</code> (Array) of errors', 'Print <code>Не заполнено поле: Контрагент</code>, <code>Не заполнено поле: Склад</code>, <code>Не заполнено поле: Сумма</code>, and then <code>Ошибок: 3</code>'],
      hint: 'In the function: Ошибки = Новый Массив; Для Каждого ИмяПоля Из СтрРазделить(Обязательные, ", ", Ложь) Цикл ... КонецЦикла; Возврат Ошибки;'
    },
    'job-workdays': {
      title: 'Checkpoint: business days',
      theory: `
<p>The final real-world task. The contract says: "payment within 5 business days". You need to find the payment deadline, and also count the business days in the first ten days of November. November 4 is a public holiday.</p>
<p>What comes in handy:</p>
<ul>
<li><code>ДеньНедели(Дата)</code> (WeekDay) returns 1 for Monday and 7 for Sunday;</li>
<li>the next day: <code>Дата + 86400</code>;</li>
<li>holidays are handy to keep in an array and check with <code>Праздники.Найти(Дата) &lt;&gt; Неопределено</code>.</li>
</ul>
${tip('Standard configurations use a business calendar for this. But the logic under the hood is exactly the same.')}`,
      tasks: ['Write a function <code>РабочийДень(Дата)</code> (IsBusinessDay) that accounts for weekends and the holidays array', 'Print <code>Рабочих дней: 6</code> for the period from 01.11.2026 to 10.11.2026', 'Find the date 5 business days after 30.10.2026 and print <code>Оплатить до: 09.11.2026</code> ("Pay by")'],
      hint: 'РабочийДень: Возврат ДеньНедели(Дата) < 6 И Праздники.Найти(Дата) = Неопределено. To count, loop Пока Д <= Конец Цикла; for the deadline, add a day at a time until you collect 5 business days. Print the date with Формат(Д, "ДФ=dd.MM.yyyy").'
    }
  };

  const challenges = {
    'c-palindrome': { title: 'Palindrome', theory: `<p>A palindrome reads the same left to right and right to left: шалаш, казак, потоп (or "level" and "racecar" in English). Letter case doesn't matter.</p><p>Check the word in the variable and print <b>Палиндром</b> (Palindrome) or <b>Не палиндром</b> (Not a palindrome). 1C has no built-in string reverse, so you'll have to build one with a loop and <code>Сред()</code>.</p>`, tasks: ['Reverse the string in a loop', 'Print <code>Палиндром</code> for the word Шалаш'], hint: 'Наоборот = ""; Для Сч = 1 По СтрДлина(Слово) Цикл Наоборот = Сред(Слово, Сч, 1) + Наоборот; КонецЦикла; compare НРег() of both.' },
    'c-digits': { title: 'Digit sum', theory: `<p>Add up the digits of a number. A math hint: <code>Число % 10</code> gives the last digit, and <code>Цел(Число / 10)</code> chops it off.</p>`, tasks: ['Use a loop, not string functions', 'Print <code>Сумма цифр: 10</code> for the number 2026'], hint: 'Пока Число > 0 Цикл Сумма = Сумма + Число % 10; Число = Цел(Число / 10); КонецЦикла;' },
    'c-ticket': { title: 'Lucky ticket', theory: `<p>A six-digit ticket is lucky if the sum of the first three digits equals the sum of the last three.</p><p>The number is stored as a string. Get the digits with <code>Сред()</code> and turn them into numbers with <code>Число()</code>.</p>`, tasks: ['Sum up both halves', 'Print <code>Счастливый</code> (Lucky) or <code>Обычный</code> (Regular). For 385934 you should get Счастливый'], hint: 'Для Сч = 1 По 3: Левая = Левая + Число(Сред(Билет, Сч, 1)); Правая = Правая + Число(Сред(Билет, Сч + 3, 1));' },
    'c-factorial': { title: 'Recursive factorial', theory: `<p>The factorial of N is the product of all numbers from 1 to N. For example, 5! = 120.</p><p>Write a <b>recursive</b> function: it calls itself for N - 1 until it reaches one. Print the result without spaces between digit groups, using <code>Формат</code>.</p>`, tasks: ['The function <code>Факториал(Н)</code> calls itself', 'Print <code>3628800</code> for Н = 10, no spaces'], hint: 'Если Н <= 1 Тогда Возврат 1; КонецЕсли; Возврат Н * Факториал(Н - 1);' },
    'c-longest': { title: 'Longest word', theory: `<p>Find the longest word in the phrase. If there are several, take the first one.</p>`, tasks: ['Split the phrase into words', 'Print the longest one: <code>автоматизировать</code>'], hint: 'Слова = СтрРазделить(Фраза, " "); then Для Каждого and compare СтрДлина.' },
    'c-stock': { title: 'Warehouse balances', theory: `<p>An almost real 1C developer task. The movements table holds receipts (plus) and expenses (minus). Calculate the final balance for each item and print only the non-zero ones, in order of the item's first appearance.</p>`, tasks: ['Group the movements by item (a Соответствие works great)', 'Print only non-zero balances: <code>Ручка: 5</code> and <code>Степлер: 2</code>'], hint: 'Остатки = Новый Соответствие; for each row: Было = Остатки[Стр.Товар]; if Неопределено, then 0; Остатки[Стр.Товар] = Было + Стр.Количество.' },
    'c-bubble': { title: 'Bubble sort', theory: `<p>A 1C Array has no sort method. You'll have to write one by hand! Bubble sort: walk the array and swap neighbors if the left one is bigger. Repeat while there's something to swap.</p><p>Print the result on one line, separated by a comma and a space.</p>`, tasks: ['Sort the array with two nested loops', 'Print <code>1, 2, 3, 5, 8, 9</code>'], hint: 'Для Проход = 0 По Числа.Количество() - 2, inside Для Й = 0 По Числа.Количество() - 2 - Проход. You can\'t use the letter И as a counter, it\'s a keyword (AND). If Числа[Й] > Числа[Й + 1], swap through a temp variable.' }
  };
  const levelNames = { 'Лёгкий': 'Easy', 'Средний': 'Medium', 'Сложный': 'Hard' };

  const badges = {
    first: { title: 'First Message', desc: 'Complete the very first lesson' },
    hello: { title: 'Recruit', desc: 'Finish the "First steps" chapter' },
    vars: { title: 'Keeper', desc: 'Finish the "Variables and types" chapter' },
    cond: { title: 'Crossroads', desc: 'Finish the "Conditions" chapter' },
    loops: { title: 'Loop Master', desc: 'Finish the "Loops" chapter' },
    coll: { title: 'Collector', desc: 'Finish the "Collections" chapter' },
    func: { title: 'Functional', desc: 'Finish the "Procedures and functions" chapter' },
    str: { title: 'String Master', desc: 'Finish the "Strings and errors" chapter', glyph: 'Aa' },
    arch: { title: 'Architect', desc: 'Finish the "How 1C works" chapter' },
    job: { title: 'On Staff', desc: 'Finish the "Real work tasks" chapter' },
    hunter: { title: 'Hunter', desc: 'Solve 3 challenges' },
    legend: { title: 'Legend', desc: 'Solve every challenge' },
    streak3: { title: 'On Fire', desc: 'Study 3 days in a row', glyph: '3d' },
    tinker: { title: 'Tinkerer', desc: 'Run code in the sandbox 10 times' },
    senior: { title: 'Senior', desc: 'Earn 500 XP' },
    sniper: { title: 'Sniper', desc: 'Get a combo of 5 clean solutions' },
    goal: { title: 'Goal Reached', desc: 'Hit your daily XP goal' },
    chests: { title: 'Treasure Hunter', desc: 'Open 3 chests' },
    cert: { title: 'Graduate', desc: 'Finish the whole course and get the certificate' }
  };

  const levels = ['Intern', 'Junior', 'Middle', '1C:Professional', 'Senior', '1C:Specialist', 'Architect', '1C:Expert'];
  const cheats = ['Output and comments', 'Variables', 'Conditions', 'Loops', 'Array', 'Structure', 'Map', 'ValueTable', 'Procedures and functions', 'Strings', 'Numbers and dates', 'Errors'];
  const sandboxExamples = ['Hello, world', 'FizzBuzz', 'ValueTable', 'Dice', 'Try'];

  return { chapters, lessons, challenges, levelNames, badges, levels, cheats, sandboxExamples, tip, warn };
})();
if (typeof module !== 'undefined') module.exports = CONTENT_EN;
