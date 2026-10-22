/* 1С·декс: интерпретатор подмножества встроенного языка 1С:Предприятие */
var BSL = (function () {
  'use strict';

  const KW = {
    'если': 'IF', 'if': 'IF', 'тогда': 'THEN', 'then': 'THEN', 'иначеесли': 'ELSIF', 'elsif': 'ELSIF',
    'иначе': 'ELSE', 'else': 'ELSE', 'конецесли': 'ENDIF', 'endif': 'ENDIF',
    'для': 'FOR', 'for': 'FOR', 'каждого': 'EACH', 'each': 'EACH', 'из': 'IN', 'in': 'IN', 'по': 'TO', 'to': 'TO',
    'цикл': 'DO', 'do': 'DO', 'конеццикла': 'ENDDO', 'enddo': 'ENDDO', 'пока': 'WHILE', 'while': 'WHILE',
    'процедура': 'PROC', 'procedure': 'PROC', 'конецпроцедуры': 'ENDPROC', 'endprocedure': 'ENDPROC',
    'функция': 'FUNC', 'function': 'FUNC', 'конецфункции': 'ENDFUNC', 'endfunction': 'ENDFUNC',
    'возврат': 'RETURN', 'return': 'RETURN', 'прервать': 'BREAK', 'break': 'BREAK',
    'продолжить': 'CONTINUE', 'continue': 'CONTINUE', 'перем': 'VAR', 'var': 'VAR',
    'экспорт': 'EXPORT', 'export': 'EXPORT', 'знач': 'VAL', 'val': 'VAL',
    'и': 'AND', 'and': 'AND', 'или': 'OR', 'or': 'OR', 'не': 'NOT', 'not': 'NOT',
    'истина': 'TRUE', 'true': 'TRUE', 'ложь': 'FALSE', 'false': 'FALSE',
    'неопределено': 'UNDEF', 'undefined': 'UNDEF', 'null': 'NULL',
    'новый': 'NEW', 'new': 'NEW', 'попытка': 'TRY', 'try': 'TRY', 'исключение': 'EXCEPT', 'except': 'EXCEPT',
    'конецпопытки': 'ENDTRY', 'endtry': 'ENDTRY', 'вызватьисключение': 'RAISE', 'raise': 'RAISE'
  };
  const KW_NAMES = {
    ENDIF: 'КонецЕсли', ENDDO: 'КонецЦикла', ENDPROC: 'КонецПроцедуры', ENDFUNC: 'КонецФункции',
    ELSE: 'Иначе', ELSIF: 'ИначеЕсли', EXCEPT: 'Исключение', ENDTRY: 'КонецПопытки',
    THEN: 'Тогда', DO: 'Цикл', TO: 'По', IN: 'Из'
  };
  const BLOCK_END = ['ENDIF', 'ENDDO', 'ENDPROC', 'ENDFUNC', 'ELSE', 'ELSIF', 'EXCEPT', 'ENDTRY'];
  const ID_START = /[A-Za-zА-Яа-яЁё_]/;
  const ID_CHAR = /[A-Za-zА-Яа-яЁё_0-9]/;
  const IDENT = /^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё_0-9]*$/;

  class BslError extends Error {
    constructor(msg, line, kind) { super(msg); this.line = line; this.kind = kind || 'runtime'; }
  }
  const rt = (msg) => new BslError(msg, null, 'runtime');

  /* ---------- значения ---------- */
  const NULLV = Object.freeze({ __null: true });
  class Arr { constructor(a) { this.a = a || []; } }
  class Struct {
    constructor() { this.m = new Map(); }
    has(k) { return this.m.has(String(k).toLowerCase()); }
    get(k) { return this.m.get(String(k).toLowerCase()); }
    set(k, v) { const low = String(k).toLowerCase(); const e = this.m.get(low); if (e) e.val = v; else this.m.set(low, { key: String(k), val: v }); }
    del(k) { this.m.delete(String(k).toLowerCase()); }
    entries() { return [...this.m.values()]; }
  }
  class Corr {
    constructor() { this.m = new Map(); }
    nk(k) {
      if (k instanceof Date) return 'd:' + k.getTime();
      if (k instanceof TypeV) return 't:' + k.name;
      if (k !== null && typeof k === 'object') return k;
      return (typeof k) + ':' + String(k);
    }
    get(k) { const e = this.m.get(this.nk(k)); return e ? e.val : undefined; }
    set(k, v) { const n = this.nk(k); const e = this.m.get(n); if (e) e.val = v; else this.m.set(n, { key: k, val: v }); }
    del(k) { this.m.delete(this.nk(k)); }
    entries() { return [...this.m.values()]; }
  }
  class KV { constructor(k, v) { this.key = k; this.val = v; } }
  class TypeV { constructor(n) { this.name = n; } }
  class Col { constructor(n) { this.name = n; this.low = n.toLowerCase(); } }
  class VTable {
    constructor() { this.cols = []; this.rows = []; this.colsObj = new Cols(this); }
    col(name) { const low = String(name).trim().toLowerCase(); return this.cols.find(c => c.low === low); }
    needCol(name) { const c = this.col(name); if (!c) throw rt(`Колонка не найдена (${name})`); return c; }
  }
  class Cols { constructor(t) { this.t = t; } }
  class Row {
    constructor(t) { this.t = t; this.v = new Map(); }
    get(name) { const c = this.t.col(name); if (!c) throw rt(`Поле объекта не обнаружено (${name})`); return this.v.get(c.low); }
    set(name, val) { const c = this.t.col(name); if (!c) throw rt(`Поле объекта не обнаружено (${name})`); this.v.set(c.low, val); }
  }
  class Rng { }

  const TYPE_NAMES = ['Число', 'Строка', 'Дата', 'Булево', 'Неопределено', 'Null', 'Массив', 'Структура',
    'Соответствие', 'ТаблицаЗначений', 'СтрокаТаблицыЗначений', 'КлючИЗначение', 'Тип', 'ГенераторСлучайныхЧисел'];

  function typeName(v) {
    if (v === undefined) return 'Неопределено';
    if (v === NULLV) return 'Null';
    if (typeof v === 'number') return 'Число';
    if (typeof v === 'string') return 'Строка';
    if (typeof v === 'boolean') return 'Булево';
    if (v instanceof Date) return 'Дата';
    if (v instanceof Arr) return 'Массив';
    if (v instanceof Struct) return 'Структура';
    if (v instanceof Corr) return 'Соответствие';
    if (v instanceof VTable) return 'ТаблицаЗначений';
    if (v instanceof Row) return 'СтрокаТаблицыЗначений';
    if (v instanceof KV) return 'КлючИЗначение';
    if (v instanceof TypeV) return 'Тип';
    if (v instanceof Rng) return 'ГенераторСлучайныхЧисел';
    if (v instanceof Cols) return 'КоллекцияКолонокТаблицыЗначений';
    if (v instanceof Col) return 'КолонкаТаблицыЗначений';
    return 'Объект';
  }

  const pad = (n) => (n < 10 ? '0' : '') + n;
  function roundHalfUp(x, d) { const p = Math.pow(10, d || 0); return Math.sign(x) * Math.round(Math.abs(x) * p + 1e-9) / p; }
  function fmtNum(n, opts) {
    opts = opts || {};
    if (!isFinite(n)) return String(n);
    const neg = n < 0; const x = Math.abs(n);
    let s;
    if (opts.frac != null) s = roundHalfUp(x, opts.frac).toFixed(opts.frac);
    else {
      s = String(Math.round(x * 1e10) / 1e10);
      if (/e/i.test(s)) s = x.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 10 });
    }
    let parts = s.split('.'); let ip = parts[0]; const fp = parts[1];
    if (opts.group !== false) ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    let res = ip + (fp ? (opts.sep || ',') + fp : '');
    if (neg && Number(s) !== 0) res = '-' + res;
    return res;
  }
  function fmtDate(d, f) {
    f = f || 'dd.MM.yyyy H:mm:ss';
    const map = {
      yyyy: d.getFullYear(), yy: String(d.getFullYear()).slice(-2), MM: pad(d.getMonth() + 1), M: d.getMonth() + 1,
      dd: pad(d.getDate()), d: d.getDate(), HH: pad(d.getHours()), H: d.getHours(), mm: pad(d.getMinutes()), ss: pad(d.getSeconds())
    };
    return f.replace(/yyyy|yy|MM|M|dd|d|HH|H|mm|ss/g, t => map[t]);
  }
  function toStr(v) {
    if (v === undefined || v === NULLV) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return fmtNum(v);
    if (typeof v === 'boolean') return v ? 'Да' : 'Нет';
    if (v instanceof Date) return fmtDate(v);
    if (v instanceof TypeV) return v.name;
    return typeName(v);
  }
  function toNum(v) {
    if (typeof v === 'number') return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (typeof v === 'string') {
      const s = v.replace(/[\s\u00a0]/g, '').replace(',', '.');
      if (s !== '' && !isNaN(Number(s))) return Number(s);
    }
    throw rt('Преобразование значения к типу Число не может быть выполнено');
  }
  function truthy(v) {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    throw rt('Преобразование значения к типу Булево не может быть выполнено');
  }
  function opAdd(a, b) {
    if (typeof a === 'string') return a + toStr(b);
    if (a instanceof Date) return new Date(a.getTime() + toNum(b) * 1000);
    if (typeof a === 'number') return a + toNum(b);
    throw rt('Преобразование значения к типу Число не может быть выполнено');
  }
  function opSub(a, b) {
    if (a instanceof Date && b instanceof Date) return (a.getTime() - b.getTime()) / 1000;
    if (a instanceof Date) return new Date(a.getTime() - toNum(b) * 1000);
    return toNum(a) - toNum(b);
  }
  function eq(a, b) {
    if (a === b) return true;
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    if (a instanceof TypeV && b instanceof TypeV) return a.name === b.name;
    return false;
  }
  function cmp(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return a < b ? -1 : a > b ? 1 : 0;
    if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0;
    if (a instanceof Date && b instanceof Date) return Math.sign(a - b);
    if (typeof a === 'boolean' && typeof b === 'boolean') return (a ? 1 : 0) - (b ? 1 : 0);
    throw rt('Сравнивать на больше-меньше можно только значения одного примитивного типа (Число, Строка, Дата, Булево)');
  }
  function sortCmp(a, b) {
    if (a === undefined && b === undefined) return 0;
    if (a === undefined) return -1; if (b === undefined) return 1;
    if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b, 'ru');
    try { return cmp(a, b); } catch (e) { return 0; }
  }

  /* ---------- лексер ---------- */
  function tokenize(src) {
    const toks = []; let i = 0, line = 1; const n = src.length;
    const lineStart = (p) => { let j = p - 1; while (j >= 0 && (src[j] === ' ' || src[j] === '\t' || src[j] === '\r')) j--; return j < 0 || src[j] === '\n'; };
    while (i < n) {
      const c = src[i];
      if (c === '\n') { line++; i++; continue; }
      if (c === ' ' || c === '\t' || c === '\r' || c === '\u00a0' || c === '\ufeff') { i++; continue; }
      if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if ((c === '&' || c === '#') && lineStart(i)) { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '"') {
        let s = ''; i++; const sl = line;
        for (;;) {
          if (i >= n) throw new BslError('Не закрыта строка: не хватает кавычки "', sl, 'syntax');
          const ch = src[i];
          if (ch === '"') { if (src[i + 1] === '"') { s += '"'; i += 2; continue; } i++; break; }
          if (ch === '\n') {
            line++; i++;
            while (i < n && (src[i] === ' ' || src[i] === '\t' || src[i] === '\r')) i++;
            if (src[i] === '|') { s += '\n'; i++; continue; }
            throw new BslError('Не закрыта строка: не хватает кавычки "', sl, 'syntax');
          }
          s += ch; i++;
        }
        toks.push({ t: 'str', v: s, line: sl });
        continue;
      }
      if (c === "'") {
        let j = i + 1; let s = '';
        while (j < n && src[j] !== "'" && src[j] !== '\n') { s += src[j]; j++; }
        if (src[j] !== "'") throw new BslError('Не закрыт литерал даты', line, 'syntax');
        const d = s.replace(/\D/g, '');
        if (d.length < 8) throw new BslError('Неверный литерал даты', line, 'syntax');
        const dt = new Date(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8), +(d.slice(8, 10) || 0), +(d.slice(10, 12) || 0), +(d.slice(12, 14) || 0));
        toks.push({ t: 'date', v: dt, line }); i = j + 1; continue;
      }
      if (/[0-9]/.test(c)) {
        let j = i; while (j < n && /[0-9]/.test(src[j])) j++;
        if (src[j] === '.' && /[0-9]/.test(src[j + 1] || '')) { j++; while (j < n && /[0-9]/.test(src[j])) j++; }
        toks.push({ t: 'num', v: parseFloat(src.slice(i, j)), line }); i = j; continue;
      }
      if (ID_START.test(c)) {
        let j = i; while (j < n && ID_CHAR.test(src[j])) j++;
        const w = src.slice(i, j); const low = w.toLowerCase().replace(/ё/g, 'е');
        if (KW[low]) toks.push({ t: 'kw', v: KW[low], raw: w, line });
        else toks.push({ t: 'id', v: w, low, line });
        i = j; continue;
      }
      const two = src.substr(i, 2);
      if (two === '<>' || two === '<=' || two === '>=') { toks.push({ t: 'op', v: two, line }); i += 2; continue; }
      if ('+-*/%=<>()[],;.?'.includes(c)) { toks.push({ t: 'op', v: c, line }); i++; continue; }
      throw new BslError(`Непонятный символ "${c}"`, line, 'syntax');
    }
    toks.push({ t: 'eof', line });
    return toks;
  }

  /* ---------- парсер ---------- */
  class Parser {
    constructor(t) { this.t = t; this.p = 0; }
    peek(o) { return this.t[this.p + (o || 0)]; }
    next() { return this.t[this.p++]; }
    isKw(v) { const k = this.peek(); return k.t === 'kw' && k.v === v; }
    isOp(v) { const k = this.peek(); return k.t === 'op' && k.v === v; }
    show(k) { return k.t === 'eof' ? 'конец кода' : k.t === 'str' ? `"${k.v}"` : (k.raw || k.v); }
    fail(msg) { const k = this.peek(); throw new BslError(msg + `, а встретилось: ${this.show(k)}`, k.line, 'syntax'); }
    eatKw(v) { if (!this.isKw(v)) this.fail(`Ожидается ${KW_NAMES[v] || v}`); return this.next(); }
    eatOp(v) { if (!this.isOp(v)) this.fail(`Ожидается символ ${v}`); return this.next(); }
    skipSemis() { while (this.isOp(';')) this.next(); }
    ident(what) { const k = this.next(); if (k.t !== 'id') { this.p--; this.fail(`Ожидается ${what}`); } return k; }
    atBlockEnd() { const k = this.peek(); return k.t === 'eof' || (k.t === 'kw' && BLOCK_END.includes(k.v)); }

    parseModule() {
      const vars = [], procs = {}, body = [];
      this.skipSemis();
      while (this.peek().t !== 'eof') {
        if (this.isKw('PROC') || this.isKw('FUNC')) {
          const pr = this.parseProc();
          if (procs[pr.low]) throw new BslError(`Процедура или функция с таким именем уже определена (${pr.name})`, pr.line, 'syntax');
          procs[pr.low] = pr;
        } else if (this.isKw('VAR') && body.length === 0) {
          const st = this.parseStatement(); vars.push(...st.names);
        } else body.push(this.parseStatement());
        this.skipSemis();
      }
      return { vars, procs, body };
    }
    parseProc() {
      const kw = this.next(); const isFunc = kw.v === 'FUNC';
      const nm = this.ident(isFunc ? 'имя функции' : 'имя процедуры');
      this.eatOp('(');
      const params = [];
      if (!this.isOp(')')) {
        for (;;) {
          let byVal = false;
          if (this.isKw('VAL')) { this.next(); byVal = true; }
          const p = this.ident('имя параметра');
          let def = null, hasDef = false;
          if (this.isOp('=')) { this.next(); def = this.parseExpr(); hasDef = true; }
          params.push({ name: p.v, low: p.low, byVal, def, hasDef });
          if (this.isOp(',')) { this.next(); continue; }
          break;
        }
      }
      this.eatOp(')');
      if (this.isKw('EXPORT')) this.next();
      const end = isFunc ? 'ENDFUNC' : 'ENDPROC';
      const body = this.parseBlock([end]);
      this.eatKw(end);
      return { name: nm.v, low: nm.low, isFunc, params, body, line: kw.line };
    }
    parseBlock(enders) {
      const st = []; this.skipSemis();
      for (;;) {
        const k = this.peek();
        if (k.t === 'eof') this.fail(`Ожидается ${KW_NAMES[enders[enders.length - 1]]}`);
        if (k.t === 'kw' && enders.includes(k.v)) break;
        if (k.t === 'kw' && BLOCK_END.includes(k.v)) this.fail(`Ожидается ${KW_NAMES[enders[enders.length - 1]]}`);
        st.push(this.parseStatement());
        this.skipSemis();
      }
      return st;
    }
    parseStatement() {
      const k = this.peek(); const line = k.line;
      if (k.t === 'kw') {
        switch (k.v) {
          case 'IF': {
            this.next(); const branches = [];
            let cond = this.parseExpr(); this.eatKw('THEN');
            branches.push({ cond, body: this.parseBlock(['ELSIF', 'ELSE', 'ENDIF']) });
            while (this.isKw('ELSIF')) {
              this.next(); cond = this.parseExpr(); this.eatKw('THEN');
              branches.push({ cond, body: this.parseBlock(['ELSIF', 'ELSE', 'ENDIF']) });
            }
            let elseBody = null;
            if (this.isKw('ELSE')) { this.next(); elseBody = this.parseBlock(['ENDIF']); }
            this.eatKw('ENDIF');
            return { k: 'if', branches, elseBody, line };
          }
          case 'FOR': {
            this.next();
            if (this.isKw('EACH')) {
              this.next(); const v = this.ident('имя переменной цикла');
              this.eatKw('IN'); const coll = this.parseExpr(); this.eatKw('DO');
              const body = this.parseBlock(['ENDDO']); this.eatKw('ENDDO');
              return { k: 'foreach', name: v.v, low: v.low, coll, body, line };
            }
            const v = this.ident('имя переменной цикла или слово Каждого');
            this.eatOp('='); const from = this.parseExpr(); this.eatKw('TO'); const to = this.parseExpr(); this.eatKw('DO');
            const body = this.parseBlock(['ENDDO']); this.eatKw('ENDDO');
            return { k: 'for', name: v.v, low: v.low, from, to, body, line };
          }
          case 'WHILE': {
            this.next(); const cond = this.parseExpr(); this.eatKw('DO');
            const body = this.parseBlock(['ENDDO']); this.eatKw('ENDDO');
            return { k: 'while', cond, body, line };
          }
          case 'RETURN': {
            this.next(); let e = null;
            if (!this.isOp(';') && !this.atBlockEnd()) e = this.parseExpr();
            return { k: 'return', e, line };
          }
          case 'BREAK': this.next(); return { k: 'break', line };
          case 'CONTINUE': this.next(); return { k: 'continue', line };
          case 'VAR': {
            this.next(); const names = [];
            for (;;) { const v = this.ident('имя переменной'); names.push(v.low); if (this.isKw('EXPORT')) this.next(); if (this.isOp(',')) { this.next(); continue; } break; }
            return { k: 'var', names, line };
          }
          case 'TRY': {
            this.next(); const body = this.parseBlock(['EXCEPT']); this.eatKw('EXCEPT');
            const handler = this.parseBlock(['ENDTRY']); this.eatKw('ENDTRY');
            return { k: 'try', body, handler, line };
          }
          case 'RAISE': { this.next(); const e = this.parseExpr(); return { k: 'raise', e, line }; }
          case 'PROC': case 'FUNC': this.fail('Процедуры и функции объявляются только на верхнем уровне модуля, не внутри других блоков');
          default: this.fail('Здесь ожидается оператор');
        }
      }
      if (k.t === 'id') {
        const target = this.parsePostfix();
        if (this.isOp('=')) {
          this.next(); const e = this.parseExpr();
          if (!['id', 'member', 'index'].includes(target.k)) throw new BslError('Слева от = должна стоять переменная, поле или элемент коллекции', line, 'syntax');
          return { k: 'assign', target, e, line };
        }
        if (target.k !== 'call' && target.k !== 'mcall') this.fail('Ожидается присваивание (=) или вызов процедуры');
        return { k: 'expr', e: target, line };
      }
      this.fail('Здесь ожидается оператор');
    }
    parseExpr() { return this.parseOr(); }
    parseOr() { let l = this.parseAnd(); while (this.isKw('OR')) { const t = this.next(); l = { k: 'or', l, r: this.parseAnd(), line: t.line }; } return l; }
    parseAnd() { let l = this.parseNot(); while (this.isKw('AND')) { const t = this.next(); l = { k: 'and', l, r: this.parseNot(), line: t.line }; } return l; }
    parseNot() { if (this.isKw('NOT')) { const t = this.next(); return { k: 'not', e: this.parseNot(), line: t.line }; } return this.parseCmp(); }
    parseCmp() {
      let l = this.parseAdd();
      while (this.peek().t === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(this.peek().v)) { const o = this.next(); l = { k: 'bin', op: o.v, l, r: this.parseAdd(), line: o.line }; }
      return l;
    }
    parseAdd() {
      let l = this.parseMul();
      while (this.isOp('+') || this.isOp('-')) { const o = this.next(); l = { k: 'bin', op: o.v, l, r: this.parseMul(), line: o.line }; }
      return l;
    }
    parseMul() {
      let l = this.parseUnary();
      while (this.isOp('*') || this.isOp('/') || this.isOp('%')) { const o = this.next(); l = { k: 'bin', op: o.v, l, r: this.parseUnary(), line: o.line }; }
      return l;
    }
    parseUnary() {
      if (this.isOp('-')) { const t = this.next(); return { k: 'neg', e: this.parseUnary(), line: t.line }; }
      if (this.isOp('+')) { this.next(); return this.parseUnary(); }
      return this.parsePostfix();
    }
    parsePostfix() {
      let e = this.parsePrimary();
      for (;;) {
        if (this.isOp('.')) {
          this.next(); const nm = this.next();
          if (nm.t !== 'id' && nm.t !== 'kw') { this.p--; this.fail('После точки ожидается имя свойства или метода'); }
          const name = nm.t === 'id' ? nm.v : nm.raw; const low = name.toLowerCase().replace(/ё/g, 'е');
          if (this.isOp('(')) e = { k: 'mcall', obj: e, name, low, args: this.parseArgs(), line: nm.line };
          else e = { k: 'member', obj: e, name, low, line: nm.line };
        } else if (this.isOp('[')) {
          const t = this.next(); const idx = this.parseExpr(); this.eatOp(']');
          e = { k: 'index', obj: e, idx, line: t.line };
        } else break;
      }
      return e;
    }
    parseArgs() {
      this.eatOp('('); const args = [];
      if (this.isOp(')')) { this.next(); return args; }
      for (;;) {
        if (this.isOp(',') || this.isOp(')')) args.push(null); else args.push(this.parseExpr());
        if (this.isOp(',')) { this.next(); continue; }
        break;
      }
      this.eatOp(')');
      return args;
    }
    parsePrimary() {
      const k = this.next();
      if (k.t === 'num' || k.t === 'str' || k.t === 'date') return { k: 'lit', v: k.v };
      if (k.t === 'kw') {
        if (k.v === 'TRUE') return { k: 'lit', v: true };
        if (k.v === 'FALSE') return { k: 'lit', v: false };
        if (k.v === 'UNDEF') return { k: 'lit', v: undefined };
        if (k.v === 'NULL') return { k: 'lit', v: NULLV };
        if (k.v === 'NEW') {
          const nm = this.ident('имя типа после Новый');
          const args = this.isOp('(') ? this.parseArgs() : [];
          return { k: 'new', type: nm.v, low: nm.low, args, line: k.line };
        }
      }
      if (k.t === 'op' && k.v === '(') { const e = this.parseExpr(); this.eatOp(')'); return e; }
      if (k.t === 'op' && k.v === '?') {
        this.p--; this.next();
        const args = this.parseArgs();
        if (args.length !== 3 || args.some(a => !a)) throw new BslError('Оператору ?() нужны три параметра: условие, значение если Истина, значение если Ложь', k.line, 'syntax');
        return { k: 'tern', c: args[0], a: args[1], b: args[2], line: k.line };
      }
      if (k.t === 'id') {
        if (this.isOp('(')) return { k: 'call', name: k.v, low: k.low, args: this.parseArgs(), line: k.line };
        return { k: 'id', name: k.v, low: k.low, line: k.line };
      }
      this.p--; this.fail('Ожидается значение или выражение');
    }
  }

  /* ---------- исполнитель ---------- */
  class Env {
    constructor(parent) { this.vars = new Map(); this.parent = parent; }
    lookup(low) { let e = this; while (e) { if (e.vars.has(low)) return e; e = e.parent; } return null; }
  }
  const BREAK = { sig: 'break' }, CONT = { sig: 'continue' };
  class ReturnSig { constructor(v) { this.v = v; } }

  const SYMBOLS = new Struct();
  [['ПС', '\n'], ['ВК', '\r'], ['Таб', '\t'], ['НПП', '\u00a0'], ['ПФ', '\f'], ['ВТаб', '\v']].forEach(([k, v]) => SYMBOLS.set(k, v));
  const GLOBALS = { 'символы': SYMBOLS, 'chars': SYMBOLS };

  function idxArg(i, len, allowEnd) {
    if (typeof i !== 'number' || i < 0 || Math.floor(i) !== i || (allowEnd ? i > len : i >= len)) throw rt('Значение индекса выходит за границы диапазона');
    return i;
  }
  function parseFormat(f) {
    const o = {};
    String(f || '').split(';').forEach(p => {
      const m = p.match(/^\s*([A-Za-zА-Яа-яЁё]+)\s*=\s*'?(.*?)'?\s*$/);
      if (m) o[m[1].toUpperCase()] = m[2];
    });
    return o;
  }

  class Interp {
    constructor(mod, opts) {
      this.mod = mod; this.out = []; this.steps = 0; this.depth = 0; this.lastErr = '';
      this.maxSteps = opts.maxSteps || 500000;
      this.modEnv = new Env(null);
      mod.vars.forEach(v => this.modEnv.vars.set(v, undefined));
    }
    tick() { if (++this.steps > this.maxSteps) throw new BslError('Код выполняется слишком долго. Похоже на бесконечный цикл', null, 'fatal'); }
    setVar(low, val, env) { const sc = env.lookup(low); (sc || env).vars.set(low, val); }
    getVar(low, name, env) {
      const sc = env.lookup(low);
      if (sc) return sc.vars.get(low);
      if (GLOBALS[low]) return GLOBALS[low];
      if (this.mod.procs[low]) throw rt(`Чтобы вызвать ${name}, добавь скобки: ${name}()`);
      throw rt(`Переменная не определена (${name})`);
    }
    execBlock(st, env) { for (let i = 0; i < st.length; i++) this.exec(st[i], env); }
    loopBody(body, env) {
      try { this.execBlock(body, env); return 0; }
      catch (e) { if (e === BREAK) return 1; if (e === CONT) return 0; throw e; }
    }
    exec(s, env) {
      this.tick();
      try {
        switch (s.k) {
          case 'assign': {
            const val = this.ev(s.e, env); const t = s.target;
            if (t.k === 'id') this.setVar(t.low, val, env);
            else if (t.k === 'member') setMember(this.ev(t.obj, env), t.name, val);
            else setIndex(this.ev(t.obj, env), this.ev(t.idx, env), val);
            break;
          }
          case 'expr': if (s.e.k === 'call') this.call(s.e, env, true); else this.ev(s.e, env); break;
          case 'if': {
            for (const b of s.branches) { if (truthy(this.ev(b.cond, env))) { this.execBlock(b.body, env); return; } }
            if (s.elseBody) this.execBlock(s.elseBody, env);
            break;
          }
          case 'for': {
            const from = this.ev(s.from, env), to = this.ev(s.to, env);
            if (typeof from !== 'number' || typeof to !== 'number') throw rt('Границы цикла Для должны быть числами');
            this.setVar(s.low, from, env);
            for (;;) {
              const cur = this.getVar(s.low, s.name, env);
              if (typeof cur !== 'number' || cur > to) break;
              this.tick();
              if (this.loopBody(s.body, env)) break;
              this.setVar(s.low, toNum(this.getVar(s.low, s.name, env)) + 1, env);
            }
            break;
          }
          case 'foreach': {
            const items = iterate(this.ev(s.coll, env));
            for (const it of items) { this.tick(); this.setVar(s.low, it, env); if (this.loopBody(s.body, env)) break; }
            break;
          }
          case 'while': {
            while (truthy(this.ev(s.cond, env))) { this.tick(); if (this.loopBody(s.body, env)) break; }
            break;
          }
          case 'return': throw new ReturnSig(s.e ? this.ev(s.e, env) : undefined);
          case 'break': throw BREAK;
          case 'continue': throw CONT;
          case 'var': s.names.forEach(n => { if (!env.vars.has(n)) env.vars.set(n, undefined); }); break;
          case 'try': {
            try { this.execBlock(s.body, env); }
            catch (e) {
              if (!(e instanceof BslError) || e.kind === 'fatal') throw e;
              if (e.line == null) e.line = s.line;
              this.lastErr = e.user ? e.message : `{Модуль(${e.line})}: ${e.message}`;
              this.execBlock(s.handler, env);
            }
            break;
          }
          case 'raise': { const er = new BslError(toStr(this.ev(s.e, env)), s.line, 'runtime'); er.user = true; throw er; }
        }
      } catch (e) {
        if (e instanceof BslError && e.line == null) e.line = s.line;
        throw e;
      }
    }
    ev(e, env) {
      switch (e.k) {
        case 'lit': return e.v;
        case 'id': return this.getVar(e.low, e.name, env);
        case 'bin': {
          const a = this.ev(e.l, env), b = this.ev(e.r, env);
          switch (e.op) {
            case '+': return opAdd(a, b);
            case '-': return opSub(a, b);
            case '*': return toNum(a) * toNum(b);
            case '/': { const d = toNum(b); if (d === 0) throw rt('Деление на 0'); return toNum(a) / d; }
            case '%': { const d = toNum(b); if (d === 0) throw rt('Деление на 0'); return toNum(a) % d; }
            case '=': return eq(a, b);
            case '<>': return !eq(a, b);
            case '<': return cmp(a, b) < 0;
            case '>': return cmp(a, b) > 0;
            case '<=': return cmp(a, b) <= 0;
            case '>=': return cmp(a, b) >= 0;
          }
          break;
        }
        case 'and': return truthy(this.ev(e.l, env)) ? truthy(this.ev(e.r, env)) : false;
        case 'or': return truthy(this.ev(e.l, env)) ? true : truthy(this.ev(e.r, env));
        case 'not': return !truthy(this.ev(e.e, env));
        case 'neg': return -toNum(this.ev(e.e, env));
        case 'tern': return truthy(this.ev(e.c, env)) ? this.ev(e.a, env) : this.ev(e.b, env);
        case 'call': return this.call(e, env, false);
        case 'mcall': {
          const obj = this.ev(e.obj, env);
          return callMethod(obj, e, e.args.map(a => (a == null ? undefined : this.ev(a, env))));
        }
        case 'member': return getMember(this.ev(e.obj, env), e.name);
        case 'index': return getIndex(this.ev(e.obj, env), this.ev(e.idx, env));
        case 'new': return construct(e.low, e.type, e.args.map(a => (a == null ? undefined : this.ev(a, env))));
      }
      throw rt('Неизвестное выражение');
    }
    call(e, env, isStmt) {
      const proc = this.mod.procs[e.low];
      if (proc) return this.callUser(proc, e, env, isStmt);
      const bi = BUILTINS[e.low];
      if (bi) return bi.call(this, e.args.map(a => (a == null ? undefined : this.ev(a, env))), e, isStmt);
      throw rt(`Процедура или функция с указанным именем не определена (${e.name})`);
    }
    callUser(proc, e, env, isStmt) {
      if (!isStmt && !proc.isFunc) throw rt(`${proc.name} это процедура, она ничего не возвращает. Используй функцию, если нужен результат`);
      if (e.args.length > proc.params.length) throw rt(`Слишком много фактических параметров (${proc.name})`);
      const local = new Env(this.modEnv);
      proc.params.forEach((p, i) => {
        const node = e.args[i];
        let v;
        if (node == null) {
          if (p.hasDef) v = this.ev(p.def, local);
          else if (i >= e.args.length) throw rt(`Недостаточно фактических параметров (${proc.name})`);
        } else v = this.ev(node, env);
        local.vars.set(p.low, v);
      });
      if (++this.depth > 180) throw new BslError('Переполнение стека: слишком глубокая рекурсия', null, 'fatal');
      let ret;
      try { this.execBlock(proc.body, local); }
      catch (x) {
        if (x instanceof ReturnSig) ret = x.v;
        else if (x === BREAK || x === CONT) throw rt('Прервать и Продолжить работают только внутри цикла');
        else throw x;
      } finally { this.depth--; }
      proc.params.forEach((p, i) => {
        const node = e.args[i];
        if (!p.byVal && node && node.k === 'id') { const sc = env.lookup(node.low); if (sc) sc.vars.set(node.low, local.vars.get(p.low)); }
      });
      return proc.isFunc ? ret : undefined;
    }
  }

  function iterate(v) {
    if (v instanceof Arr) return v.a.slice();
    if (v instanceof Struct || v instanceof Corr) return v.entries().map(e => new KV(e.key, e.val));
    if (v instanceof VTable) return v.rows.slice();
    if (v instanceof Cols) return v.t.cols.slice();
    throw rt(`Для значения типа ${typeName(v)} не определён перебор (Для Каждого)`);
  }
  function getMember(o, name) {
    const low = name.toLowerCase().replace(/ё/g, 'е');
    if (o instanceof Struct) { const e = o.get(name); if (!e) throw rt(`Поле объекта не обнаружено (${name})`); return e.val; }
    if (o instanceof KV) { if (low === 'ключ' || low === 'key') return o.key; if (low === 'значение' || low === 'value') return o.val; }
    if (o instanceof Row) return o.get(name);
    if (o instanceof VTable && (low === 'колонки' || low === 'columns')) return o.colsObj;
    if (o instanceof Col && (low === 'имя' || low === 'name')) return o.name;
    if (o === undefined || o === NULLV || typeof o !== 'object') throw rt(`Значение не является значением объектного типа (${name})`);
    throw rt(`Поле объекта не обнаружено (${name})`);
  }
  function setMember(o, name, val) {
    if (o instanceof Struct) { if (!o.has(name)) throw rt(`Поле объекта не обнаружено (${name}). Добавь его через Вставить()`); o.set(name, val); return; }
    if (o instanceof Row) { o.set(name, val); return; }
    if (o === undefined || o === NULLV || typeof o !== 'object') throw rt(`Значение не является значением объектного типа (${name})`);
    throw rt(`Поле объекта недоступно для записи (${name})`);
  }
  function getIndex(o, i) {
    if (o instanceof Arr) return o.a[idxArg(i, o.a.length)];
    if (o instanceof Struct) { const e = o.get(toStr(i)); if (!e) throw rt(`Поле объекта не обнаружено (${toStr(i)})`); return e.val; }
    if (o instanceof Corr) return o.get(i);
    if (o instanceof VTable) return o.rows[idxArg(i, o.rows.length)];
    if (o instanceof Row) { if (typeof i === 'number') { const c = o.t.cols[idxArg(i, o.t.cols.length)]; return o.v.get(c.low); } return o.get(toStr(i)); }
    throw rt(`Получение элемента по индексу для значения типа ${typeName(o)} не поддерживается`);
  }
  function setIndex(o, i, val) {
    if (o instanceof Arr) { o.a[idxArg(i, o.a.length)] = val; return; }
    if (o instanceof Struct) { const k = toStr(i); if (!o.has(k)) throw rt(`Поле объекта не обнаружено (${k})`); o.set(k, val); return; }
    if (o instanceof Corr) { o.set(i, val); return; }
    if (o instanceof Row) { if (typeof i === 'number') { const c = o.t.cols[idxArg(i, o.t.cols.length)]; o.v.set(c.low, val); return; } o.set(toStr(i), val); return; }
    throw rt(`Запись элемента по индексу для значения типа ${typeName(o)} не поддерживается`);
  }
  function construct(low, name, args) {
    switch (low) {
      case 'массив': case 'array': {
        if (typeof args[0] === 'number') return new Arr(new Array(Math.max(0, Math.floor(args[0]))).fill(undefined));
        return new Arr();
      }
      case 'структура': case 'structure': {
        const s = new Struct();
        if (typeof args[0] === 'string') {
          args[0].split(',').map(x => x.trim()).filter(Boolean).forEach((k, i) => {
            if (!IDENT.test(k)) throw rt(`Задано неправильное имя поля структуры (${k})`);
            s.set(k, args[i + 1]);
          });
        }
        return s;
      }
      case 'соответствие': case 'map': return new Corr();
      case 'таблицазначений': case 'valuetable': return new VTable();
      case 'генераторслучайныхчисел': case 'randomnumbergenerator': return new Rng();
    }
    throw rt(`Тип не определен (${name})`);
  }
  function callMethod(o, node, args) {
    const m = node.low, name = node.name;
    const nf = () => rt(`Метод объекта не обнаружен (${name})`);
    if (o instanceof Arr) {
      switch (m) {
        case 'добавить': case 'add': o.a.push(args[0]); return;
        case 'вставить': case 'insert': o.a.splice(idxArg(args[0], o.a.length, true), 0, args[1]); return;
        case 'количество': case 'count': return o.a.length;
        case 'получить': case 'get': return o.a[idxArg(args[0], o.a.length)];
        case 'установить': case 'set': o.a[idxArg(args[0], o.a.length)] = args[1]; return;
        case 'удалить': case 'delete': o.a.splice(idxArg(args[0], o.a.length), 1); return;
        case 'найти': case 'find': { const i = o.a.findIndex(x => eq(x, args[0])); return i < 0 ? undefined : i; }
        case 'очистить': case 'clear': o.a.length = 0; return;
        case 'вграница': case 'ubound': return o.a.length - 1;
      }
      throw nf();
    }
    if (o instanceof Struct) {
      switch (m) {
        case 'вставить': case 'insert': {
          const k = toStr(args[0]).trim();
          if (!IDENT.test(k)) throw rt(`Задано неправильное имя поля структуры (${k})`);
          o.set(k, args[1]); return;
        }
        case 'свойство': case 'property': return o.has(toStr(args[0]));
        case 'удалить': case 'delete': o.del(toStr(args[0])); return;
        case 'количество': case 'count': return o.m.size;
        case 'очистить': case 'clear': o.m.clear(); return;
      }
      throw nf();
    }
    if (o instanceof Corr) {
      switch (m) {
        case 'вставить': case 'insert': o.set(args[0], args[1]); return;
        case 'получить': case 'get': return o.get(args[0]);
        case 'удалить': case 'delete': o.del(args[0]); return;
        case 'количество': case 'count': return o.m.size;
        case 'очистить': case 'clear': o.m.clear(); return;
      }
      throw nf();
    }
    if (o instanceof VTable) {
      switch (m) {
        case 'добавить': case 'add': { const r = new Row(o); o.rows.push(r); return r; }
        case 'количество': case 'count': return o.rows.length;
        case 'очистить': case 'clear': o.rows.length = 0; return;
        case 'получить': case 'get': return o.rows[idxArg(args[0], o.rows.length)];
        case 'удалить': case 'delete': {
          const i = args[0] instanceof Row ? o.rows.indexOf(args[0]) : idxArg(args[0], o.rows.length);
          if (i >= 0) o.rows.splice(i, 1); return;
        }
        case 'итог': case 'total': {
          const c = o.needCol(toStr(args[0]));
          return o.rows.reduce((s, r) => { const v = r.v.get(c.low); return typeof v === 'number' ? s + v : s; }, 0);
        }
        case 'свернуть': case 'groupby': {
          const names = (x) => toStr(x === undefined ? '' : x).split(',').map(q => q.trim()).filter(Boolean);
          const gc = names(args[0]).map(n => o.needCol(n)), sc = names(args[1]).map(n => o.needCol(n));
          const groups = new Map(), order = [];
          o.rows.forEach(r => {
            const key = gc.map(c => { const v = r.v.get(c.low); return typeName(v) + ':' + (v instanceof Date ? v.getTime() : toStr(v)); }).join('|');
            let g = groups.get(key);
            if (!g) { g = { first: r, sums: sc.map(() => 0) }; groups.set(key, g); order.push(g); }
            sc.forEach((c, i) => { const v = r.v.get(c.low); if (typeof v === 'number') g.sums[i] += v; });
          });
          const keepCols = gc.concat(sc);
          const rows = order.map(g => { const nr = new Row(o); gc.forEach(c => nr.v.set(c.low, g.first.v.get(c.low))); sc.forEach((c, i) => nr.v.set(c.low, g.sums[i])); return nr; });
          o.cols = keepCols; o.rows = rows;
          return;
        }
        case 'скопировать': case 'copy': {
          const t = new VTable(); t.cols = o.cols.map(c => new Col(c.name));
          t.rows = o.rows.map(r => { const nr = new Row(t); r.v.forEach((v, k) => nr.v.set(k, v)); return nr; });
          return t;
        }
        case 'выгрузитьколонку': case 'unloadcolumn': { const c = o.needCol(toStr(args[0])); return new Arr(o.rows.map(r => r.v.get(c.low))); }
        case 'найти': case 'find': {
          const cols = args[1] ? toStr(args[1]).split(',').map(x => o.needCol(x)) : o.cols;
          return o.rows.find(r => cols.some(c => eq(r.v.get(c.low), args[0])));
        }
        case 'найтистроки': case 'findrows': {
          const f = args[0]; if (!(f instanceof Struct)) throw rt('НайтиСтроки ожидает структуру с условиями отбора');
          const conds = f.entries().map(e => [o.needCol(e.key), e.val]);
          return new Arr(o.rows.filter(r => conds.every(([c, v]) => eq(r.v.get(c.low), v))));
        }
        case 'сортировать': case 'sort': {
          const spec = toStr(args[0]).split(',').map(s => s.trim()).filter(Boolean).map(s => {
            const p = s.split(/\s+/); const c = o.needCol(p[0]);
            const dir = (p[1] || '').toLowerCase(); const desc = dir === 'убыв' || dir === 'desc';
            return { c, desc };
          });
          o.rows.sort((a, b) => {
            for (const s of spec) { const r = sortCmp(a.v.get(s.c.low), b.v.get(s.c.low)); if (r) return s.desc ? -r : r; }
            return 0;
          });
          return;
        }
      }
      throw nf();
    }
    if (o instanceof Cols) {
      switch (m) {
        case 'добавить': case 'add': {
          const n = toStr(args[0]).trim();
          if (!IDENT.test(n)) throw rt(`Неверное имя колонки (${n})`);
          if (o.t.col(n)) throw rt(`Колонка с таким именем уже есть (${n})`);
          const c = new Col(n); o.t.cols.push(c); return c;
        }
        case 'количество': case 'count': return o.t.cols.length;
        case 'найти': case 'find': return o.t.col(toStr(args[0]));
      }
      throw nf();
    }
    if (o instanceof Rng) {
      if (m === 'случайноечисло' || m === 'randomnumber') {
        const lo = args[0] === undefined ? 0 : Math.ceil(toNum(args[0]));
        const hi = args[1] === undefined ? 4294967295 : Math.floor(toNum(args[1]));
        return lo + Math.floor(Math.random() * (hi - lo + 1));
      }
      throw nf();
    }
    if (o === undefined || o === NULLV || typeof o !== 'object') throw rt(`Значение не является значением объектного типа (${name})`);
    throw nf();
  }

  /* ---------- встроенные функции ---------- */
  const BUILTINS = {};
  const CANON = [];
  function def(names, fn) { CANON.push(names.split(',')[0].trim()); names.split(',').forEach(n => { BUILTINS[n.trim().toLowerCase()] = fn; }); }
  const S = (v) => toStr(v);
  const needStr = (v) => toStr(v);

  def('Сообщить,Message', function (a) { this.out.push({ t: 'msg', s: S(a[0]) }); });
  def('Предупреждение,ПоказатьПредупреждение,Warning,ShowMessageBox', function (a) { this.out.push({ t: 'warn', s: S(a[a.length > 1 && a[0] === undefined ? 1 : 0]) }); });
  def('Строка,String', a => S(a[0]));
  def('Число,Number', a => toNum(a[0]));
  def('Булево,Boolean', a => {
    const v = a[0];
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') { const l = v.trim().toLowerCase(); if (l === 'истина' || l === 'да' || l === 'true') return true; if (l === 'ложь' || l === 'нет' || l === 'false') return false; }
    throw rt('Преобразование значения к типу Булево не может быть выполнено');
  });
  def('СтрДлина,StrLen', a => needStr(a[0]).length);
  def('ВРег,Upper', a => needStr(a[0]).toUpperCase());
  def('НРег,Lower', a => needStr(a[0]).toLowerCase());
  def('ТРег,Title', a => needStr(a[0]).toLowerCase().replace(/(^|[^A-Za-zА-Яа-яЁё0-9])([A-Za-zА-Яа-яЁё])/g, (m, p, c) => p + c.toUpperCase()));
  def('СокрЛП,TrimAll', a => needStr(a[0]).trim());
  def('СокрЛ,TrimL', a => needStr(a[0]).replace(/^\s+/, ''));
  def('СокрП,TrimR', a => needStr(a[0]).replace(/\s+$/, ''));
  def('Лев,Left', a => needStr(a[0]).slice(0, Math.max(0, toNum(a[1]))));
  def('Прав,Right', a => { const s = needStr(a[0]); const n = Math.max(0, toNum(a[1])); return n ? s.slice(-n) : ''; });
  def('Сред,Mid', a => { const s = needStr(a[0]); const st = Math.max(1, toNum(a[1])) - 1; return a[2] === undefined ? s.slice(st) : s.substr(st, Math.max(0, toNum(a[2]))); });
  def('СтрНайти,StrFind,Найти,Find', a => needStr(a[0]).indexOf(needStr(a[1])) + 1);
  def('СтрЗаменить,StrReplace', a => needStr(a[0]).split(needStr(a[1])).join(needStr(a[2])));
  def('СтрЧислоВхождений,StrOccurrenceCount', a => { const sub = needStr(a[1]); return sub ? needStr(a[0]).split(sub).length - 1 : 0; });
  def('СтрРазделить,StrSplit', a => {
    const s = needStr(a[0]); const d = a[1] === undefined ? ',' : needStr(a[1]); const keep = a[2] === undefined ? true : truthy(a[2]);
    let parts;
    if (!d) parts = [s];
    else { parts = ['']; for (const ch of s) { if (d.includes(ch)) parts.push(''); else parts[parts.length - 1] += ch; } }
    if (!keep) parts = parts.filter(p => p !== '');
    return new Arr(parts);
  });
  def('СтрСоединить,StrConcat', a => {
    if (!(a[0] instanceof Arr)) throw rt('СтрСоединить ожидает массив строк');
    return a[0].a.map(S).join(a[1] === undefined ? '' : S(a[1]));
  });
  def('СтрНачинаетсяС,StrStartsWith', a => needStr(a[0]).startsWith(needStr(a[1])));
  def('СтрЗаканчиваетсяНа,StrEndsWith', a => needStr(a[0]).endsWith(needStr(a[1])));
  def('СтрШаблон,StrTemplate', a => needStr(a[0]).replace(/%(\d)/g, (m, d) => S(a[+d])));
  def('Символ,Char', a => String.fromCharCode(toNum(a[0])));
  def('КодСимвола,CharCode', a => { const s = needStr(a[0]); const p = a[1] === undefined ? 1 : toNum(a[1]); return s.charCodeAt(p - 1) || 0; });
  def('ПустаяСтрока,IsBlankString', a => needStr(a[0]).trim() === '');
  def('Окр,Round', a => roundHalfUp(toNum(a[0]), a[1] === undefined ? 0 : toNum(a[1])));
  def('Цел,Int', a => Math.trunc(toNum(a[0])));
  def('Макс,Max', a => { if (!a.length) throw rt('Макс: нужен хотя бы один параметр'); let r = a[0]; a.forEach(x => { if (cmp(x, r) > 0) r = x; }); return r; });
  def('Мин,Min', a => { if (!a.length) throw rt('Мин: нужен хотя бы один параметр'); let r = a[0]; a.forEach(x => { if (cmp(x, r) < 0) r = x; }); return r; });
  def('Pow', a => Math.pow(toNum(a[0]), toNum(a[1])));
  def('Sqrt', a => { const x = toNum(a[0]); if (x < 0) throw rt('Неверный аргумент Sqrt'); return Math.sqrt(x); });
  def('Log', a => Math.log(toNum(a[0])));
  def('Log10', a => Math.log10(toNum(a[0])));
  def('Exp', a => Math.exp(toNum(a[0])));
  def('Sin', a => Math.sin(toNum(a[0])));
  def('Cos', a => Math.cos(toNum(a[0])));
  def('Tan', a => Math.tan(toNum(a[0])));
  def('ТипЗнч,TypeOf', a => new TypeV(typeName(a[0])));
  def('Тип,Type', a => {
    const n = needStr(a[0]).trim().toLowerCase();
    const f = TYPE_NAMES.find(t => t.toLowerCase() === n);
    if (!f) throw rt(`Тип не определен (${a[0]})`);
    return new TypeV(f);
  });
  def('ЗначениеЗаполнено,ValueIsFilled', a => {
    const v = a[0];
    if (v === undefined || v === NULLV) return false;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') return v.trim() !== '';
    if (typeof v === 'boolean') return true;
    if (v instanceof Date) return v.getFullYear() > 1;
    if (v instanceof Arr) return v.a.length > 0;
    if (v instanceof Struct || v instanceof Corr) return v.m.size > 0;
    if (v instanceof VTable) return v.rows.length > 0;
    return true;
  });
  def('ТекущаяДата,CurrentDate', () => { const d = new Date(); d.setMilliseconds(0); return d; });
  def('Дата,Date', a => {
    if (typeof a[0] === 'string') { const d = a[0].replace(/\D/g, ''); return new Date(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8), +(d.slice(8, 10) || 0), +(d.slice(10, 12) || 0), +(d.slice(12, 14) || 0)); }
    return new Date(toNum(a[0]), toNum(a[1] || 1) - 1, toNum(a[2] || 1), toNum(a[3] || 0), toNum(a[4] || 0), toNum(a[5] || 0));
  });
  const needDate = (v) => { if (!(v instanceof Date)) throw rt('Ожидается значение типа Дата'); return v; };
  def('Год,Year', a => needDate(a[0]).getFullYear());
  def('Месяц,Month', a => needDate(a[0]).getMonth() + 1);
  def('День,Day', a => needDate(a[0]).getDate());
  def('Час,Hour', a => needDate(a[0]).getHours());
  def('Минута,Minute', a => needDate(a[0]).getMinutes());
  def('Секунда,Second', a => needDate(a[0]).getSeconds());
  def('ДеньНедели,WeekDay', a => { const d = needDate(a[0]).getDay(); return d === 0 ? 7 : d; });
  def('ДобавитьМесяц,AddMonth', a => { const d = new Date(needDate(a[0])); d.setMonth(d.getMonth() + toNum(a[1])); return d; });
  def('НачалоДня,BegOfDay', a => { const d = new Date(needDate(a[0])); d.setHours(0, 0, 0, 0); return d; });
  def('ОписаниеОшибки,ErrorDescription', function () { return this.lastErr; });
  def('Формат,Format', a => {
    const v = a[0]; const o = parseFormat(a[1]);
    if (typeof v === 'number') {
      const opts = {};
      if (o['ЧГ'] === '0') opts.group = false;
      if (o['ЧДЦ'] !== undefined) opts.frac = +o['ЧДЦ'];
      if (o['ЧРД']) opts.sep = o['ЧРД'];
      if (v === 0 && o['ЧН'] !== undefined) return o['ЧН'];
      if (o['ЧВН'] !== undefined && o['ЧЦ']) {
        const whole = Math.max(1, +o['ЧЦ'] - (opts.frac || 0));
        let str = fmtNum(Math.abs(v), Object.assign({}, opts, { group: false }));
        const sep = opts.sep || ',', parts = str.split(sep);
        parts[0] = parts[0].padStart(whole, '0');
        return (v < 0 ? '-' : '') + parts.join(sep);
      }
      return fmtNum(v, opts);
    }
    if (v instanceof Date) {
      if (o['ДФ']) return fmtDate(v, o['ДФ']);
      if (o['ДЛФ'] === 'Д') return fmtDate(v, 'dd.MM.yyyy');
      if (o['ДЛФ'] === 'В') return fmtDate(v, 'H:mm:ss');
      return fmtDate(v);
    }
    if (typeof v === 'boolean') { if (v && o['БИ'] !== undefined) return o['БИ']; if (!v && o['БЛ'] !== undefined) return o['БЛ']; }
    return toStr(v);
  });

  const BUILTIN_NAMES = new Set(Object.keys(BUILTINS));
  const TYPE_WORDS = new Set(['массив', 'структура', 'соответствие', 'таблицазначений', 'генераторслучайныхчисел', 'символы']);

  /* ---------- запуск ---------- */
  function run(code, opts) {
    opts = opts || {};
    const res = { out: [], error: null, vars: {}, ms: 0 };
    const t0 = Date.now();
    let mod;
    try { mod = new Parser(tokenize(code)).parseModule(); }
    catch (e) {
      if (e instanceof BslError) { res.error = { msg: e.message, line: e.line, kind: 'syntax' }; return res; }
      res.error = { msg: 'Внутренняя ошибка разбора: ' + e.message, line: null, kind: 'internal' }; return res;
    }
    const I = new Interp(mod, opts); const env = new Env(I.modEnv);
    try { I.execBlock(mod.body, env); }
    catch (e) {
      if (e instanceof BslError) res.error = { msg: e.message, line: e.line, kind: e.kind };
      else if (e === BREAK || e === CONT) res.error = { msg: 'Прервать и Продолжить работают только внутри цикла', line: null, kind: 'runtime' };
      else if (e instanceof ReturnSig) { /* Возврат в теле модуля завершает выполнение */ }
      else if (e instanceof RangeError) res.error = { msg: 'Переполнение стека: слишком глубокая рекурсия', line: null, kind: 'runtime' };
      else res.error = { msg: 'Внутренняя ошибка: ' + e.message, line: null, kind: 'internal' };
    }
    res.out = I.out;
    for (const [k, v] of I.modEnv.vars) res.vars[k] = v;
    for (const [k, v] of env.vars) res.vars[k] = v;
    res.ms = Date.now() - t0;
    return res;
  }

  /* ---------- подсветка ---------- */
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function highlight(code) {
    let out = ''; let i = 0; const n = code.length;
    const span = (c, s) => `<span class="t-${c}">${esc(s)}</span>`;
    const atLineStart = (p) => { let j = p - 1; while (j >= 0 && (code[j] === ' ' || code[j] === '\t')) j--; return j < 0 || code[j] === '\n'; };
    let prevWord = '';
    const scanStr = (from) => {
      let j = from + 1;
      while (j < n) {
        if (code[j] === '"') { if (code[j + 1] === '"') { j += 2; continue; } j++; break; }
        if (code[j] === '\n') break;
        j++;
      }
      return j;
    };
    while (i < n) {
      const c = code[i];
      if (c === '/' && code[i + 1] === '/') { let j = code.indexOf('\n', i); if (j < 0) j = n; out += span('com', code.slice(i, j)); i = j; continue; }
      if ((c === '&' || c === '#') && atLineStart(i)) { let j = code.indexOf('\n', i); if (j < 0) j = n; out += span('dir', code.slice(i, j)); i = j; continue; }
      if (c === '"' || (c === '|' && atLineStart(i))) { const j = scanStr(i); out += span('str', code.slice(i, j)); i = j; continue; }
      if (c === "'") { let j = code.indexOf("'", i + 1); const nl = code.indexOf('\n', i); if (j < 0 || (nl >= 0 && nl < j)) j = (nl < 0 ? n : nl) - 1; out += span('num', code.slice(i, j + 1)); i = j + 1; continue; }
      if (/[0-9]/.test(c)) { let j = i; while (j < n && /[0-9.]/.test(code[j])) j++; out += span('num', code.slice(i, j)); i = j; continue; }
      if (ID_START.test(c)) {
        let j = i; while (j < n && ID_CHAR.test(code[j])) j++;
        const w = code.slice(i, j); const low = w.toLowerCase().replace(/ё/g, 'е');
        const k = KW[low];
        if (k === 'TRUE' || k === 'FALSE' || k === 'UNDEF' || k === 'NULL') out += span('const', w);
        else if (k) out += span('kw', w);
        else if (code[j] === '(' && BUILTIN_NAMES.has(low)) out += span('fn', w);
        else if (prevWord === 'NEW' || TYPE_WORDS.has(low)) out += span('type', w);
        else if (code[j] === '(') out += span('call', w);
        else out += esc(w);
        prevWord = k || '';
        i = j; continue;
      }
      if ('+-*/%=<>()[],;.?'.includes(c)) { out += span('op', c); i++; continue; }
      if (c !== ' ' && c !== '\t' && c !== '\n') prevWord = '';
      out += esc(c); i++;
    }
    return out;
  }

  return { run, highlight, toStr, typeName, Arr, Struct, Corr, VTable, Row, KW, NAMES: CANON };
})();
if (typeof module !== 'undefined') module.exports = BSL;
