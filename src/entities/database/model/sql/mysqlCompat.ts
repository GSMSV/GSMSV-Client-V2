/**
 * MySQL 문법을 브라우저 안의 SQLite(sql.js)가 실행할 수 있게 바꾸는 얇은 호환 계층.
 * 자주 쓰는 문장만 옮기고, 옮기지 않은 문장은 그대로 SQLite에 넘겨 엔진이 내는 진짜 오류를 보여 준다.
 */

export type CompatStatement =
  | { kind: 'sql'; sql: string[]; source: string }
  | { kind: 'show-tables'; full: boolean; source: string }
  | { kind: 'show-databases'; source: string }
  | { kind: 'describe'; table: string; source: string }
  | { kind: 'show-create'; table: string; source: string }
  | { kind: 'use'; database: string; source: string }
  | { kind: 'truncate'; table: string; source: string }
  | { kind: 'error'; message: string; source: string };

/** 따옴표·주석을 지키며 `;`로 문장을 나눈다. 주석은 지운다. */
export function splitSqlStatements(input: string): string[] {
  const statements: string[] = [];
  let current = '';
  let index = 0;
  while (index < input.length) {
    const char = input[index];
    const next = input[index + 1];
    if (char === "'" || char === '"' || char === '`') {
      let end = index + 1;
      while (end < input.length) {
        if (input[end] === '\\' && char !== '`') { end += 2; continue; }
        if (input[end] === char) {
          if (input[end + 1] === char) { end += 2; continue; }
          break;
        }
        end += 1;
      }
      current += input.slice(index, end + 1);
      index = end + 1;
      continue;
    }
    if ((char === '-' && next === '-' && /\s|$/.test(input[index + 2] ?? '')) || char === '#') {
      const end = input.indexOf('\n', index);
      index = end === -1 ? input.length : end;
      current += ' ';
      continue;
    }
    if (char === '/' && next === '*') {
      const end = input.indexOf('*/', index + 2);
      index = end === -1 ? input.length : end + 2;
      current += ' ';
      continue;
    }
    if (char === ';') {
      if (current.trim()) statements.push(current.trim());
      current = '';
      index += 1;
      continue;
    }
    current += char;
    index += 1;
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

/** 문자열·식별자 따옴표 밖의 부분에만 fn을 적용한다. */
function mapOutsideQuotes(sql: string, fn: (segment: string) => string): string {
  let result = '';
  let plain = '';
  let index = 0;
  while (index < sql.length) {
    const char = sql[index];
    if (char === "'" || char === '"' || char === '`') {
      result += fn(plain);
      plain = '';
      let end = index + 1;
      while (end < sql.length) {
        if (sql[end] === '\\' && char !== '`') { end += 2; continue; }
        if (sql[end] === char) {
          if (sql[end + 1] === char) { end += 2; continue; }
          break;
        }
        end += 1;
      }
      result += sql.slice(index, end + 1);
      index = end + 1;
      continue;
    }
    plain += char;
    index += 1;
  }
  return result + fn(plain);
}

/** 괄호 깊이 0에서 쉼표로 나눈다(따옴표 안 쉼표는 무시). */
function splitTopLevel(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  let quote: string | null = null;
  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    if (quote) {
      current += char;
      if (char === '\\' && quote !== '`') { current += body[index + 1] ?? ''; index += 1; continue; }
      if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') { quote = char; current += char; continue; }
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) { parts.push(current.trim()); current = ''; continue; }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** 여는 괄호 위치에서 짝이 맞는 닫는 괄호 위치를 찾는다. */
function matchingParen(sql: string, open: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (let index = open; index < sql.length; index += 1) {
    const char = sql[index];
    if (quote) {
      if (char === '\\' && quote !== '`') { index += 1; continue; }
      if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') { quote = char; continue; }
    if (char === '(') depth += 1;
    if (char === ')') { depth -= 1; if (depth === 0) return index; }
  }
  return -1;
}

const identifier = String.raw`(?:\x60(?:[^\x60]|\x60\x60)+\x60|"[^"]+"|[A-Za-z_][\w$]*)`;
const qualified = String.raw`(?:${identifier}\s*\.\s*)?${identifier}`;

export function unquoteIdentifier(value: string): string {
  const trimmed = value.trim();
  const last = trimmed.split(/\s*\.\s*(?=[`"A-Za-z_][^.]*$)/).pop() ?? trimmed;
  if ((last.startsWith('`') && last.endsWith('`')) || (last.startsWith('"') && last.endsWith('"'))) {
    return last.slice(1, -1).replaceAll(last[0] + last[0], last[0]);
  }
  return last;
}

export function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

/** 실행 전 쓰기 금지 판단에 쓰는, 크기를 늘릴 수 있는 문장인지. */
export function isGrowingStatement(statement: string): boolean {
  return /^\s*(insert|replace|update|create|alter)\b/i.test(statement);
}

/** 결과를 파일에 저장할 필요가 없는 읽기 전용 문장인지. */
export function isReadOnlyStatement(statement: string): boolean {
  return /^\s*(select|show|describe|desc|explain|use)\b/i.test(statement);
}

function translateExpressions(sql: string): string {
  return mapOutsideQuotes(sql, segment => segment
    .replace(/\bLAST_INSERT_ID\s*\(\s*\)/gi, 'last_insert_rowid()')
    .replace(/\bCURRENT_TIMESTAMP\s*\(\s*\d*\s*\)/gi, 'NOW()')
    .replace(/\bFROM\s+DUAL\b/gi, ''));
}

function translateColumnDefaults(segment: string): string {
  return mapOutsideQuotes(segment, part => part
    .replace(/\bDEFAULT\s+(?:CURRENT_TIMESTAMP(?:\s*\(\s*\d*\s*\))?|NOW\s*\(\s*\d*\s*\))/gi, "DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now','localtime'))")
    .replace(/\bON\s+UPDATE\s+(?:CURRENT_TIMESTAMP(?:\s*\(\s*\d*\s*\))?|NOW\s*\(\s*\d*\s*\))/gi, '')
    .replace(/\b(?:CHARACTER\s+SET|CHARSET)\s+\w+/gi, '')
    .replace(/\bCOLLATE\s+\w+/gi, '')
    .replace(/\b(?:UNSIGNED|ZEROFILL|SIGNED)\b/gi, ''));
}

function translateCreateTable(statement: string): CompatStatement {
  const header = statement.match(new RegExp(String.raw`^CREATE\s+(TEMPORARY\s+)?TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(${qualified})\s*`, 'i'));
  if (!header) return { kind: 'sql', sql: [statement], source: statement };
  const open = header[0].length;
  if (statement[open] !== '(') return { kind: 'sql', sql: [translateExpressions(statement)], source: statement };
  const close = matchingParen(statement, open);
  if (close === -1) return { kind: 'sql', sql: [statement], source: statement };
  const tableName = unquoteIdentifier(header[3]);
  const definitions = splitTopLevel(statement.slice(open + 1, close));
  const indexes: string[] = [];
  const columns: string[] = [];
  let autoColumn: string | null = null;
  let tablePrimaryKey: string[] | null = null;

  for (const definition of definitions) {
    const primary = definition.match(/^(?:CONSTRAINT\s+\S+\s+)?PRIMARY\s+KEY\s*(?:\w+\s*)?\(([^)]*)\)/i);
    if (primary) { tablePrimaryKey = splitTopLevel(primary[1]).map(column => unquoteIdentifier(column.replace(/\(\d+\)|\s+(ASC|DESC)$/gi, ''))); continue; }
    const unique = definition.match(new RegExp(String.raw`^(?:CONSTRAINT\s+\S+\s+)?UNIQUE\s+(?:KEY|INDEX)?\s*(?:${identifier}\s*)?\(([^)]*)\)`, 'i'));
    if (unique) { columns.push(`UNIQUE (${unique[1].replace(/\(\d+\)/g, '')})`); continue; }
    const plainIndex = definition.match(new RegExp(String.raw`^(?:FULLTEXT\s+|SPATIAL\s+)?(?:KEY|INDEX)\s*(${identifier})?\s*(?:USING\s+\w+\s*)?\(([^)]*)\)`, 'i'));
    if (plainIndex) {
      if (/^(FULLTEXT|SPATIAL)/i.test(definition)) continue;
      const indexName = `${tableName}_${plainIndex[1] ? unquoteIdentifier(plainIndex[1]) : `idx${indexes.length + 1}`}`;
      indexes.push(`CREATE INDEX IF NOT EXISTS ${quoteIdentifier(indexName)} ON ${quoteIdentifier(tableName)} (${plainIndex[2].replace(/\(\d+\)/g, '')})`);
      continue;
    }
    if (/^(CONSTRAINT|FOREIGN\s+KEY|CHECK)\b/i.test(definition)) { columns.push(definition); continue; }
    const column = definition.match(new RegExp(String.raw`^(${identifier})\s+([\s\S]*)$`));
    if (!column) { columns.push(definition); continue; }
    const name = column[1];
    let rest = column[2];
    rest = rest.replace(/^(ENUM|SET)\s*\((?:[^()']|'(?:[^'\\]|\\.|'')*')*\)/i, 'TEXT');
    rest = rest.replace(/\bCOMMENT\s+'(?:[^'\\]|\\.|'')*'/gi, '');
    rest = translateColumnDefaults(rest);
    if (/\bAUTO_INCREMENT\b/i.test(rest)) {
      autoColumn = unquoteIdentifier(name);
      const inlinePrimary = /\bPRIMARY\s+KEY\b/i.test(rest);
      const constraints = rest
        .replace(/\bAUTO_INCREMENT\b/gi, '')
        .replace(/\bPRIMARY\s+KEY\b/gi, '')
        .replace(/^\s*\w+(?:\s*\([^)]*\))?/, '')
        .replace(/\s+/g, ' ')
        .trim();
      columns.push(`${name} INTEGER ${constraints}${inlinePrimary ? ' PRIMARY KEY AUTOINCREMENT' : ' __AUTO_PRIMARY__'}`.replace(/\s+/g, ' ').trim());
      continue;
    }
    columns.push(`${name} ${rest.replace(/\s+/g, ' ').trim()}`);
  }

  if (autoColumn) {
    const placeholderIndex = columns.findIndex(column => column.endsWith('__AUTO_PRIMARY__'));
    if (placeholderIndex >= 0) {
      if (!tablePrimaryKey || tablePrimaryKey.length !== 1 || tablePrimaryKey[0] !== autoColumn) {
        return { kind: 'error', message: 'Incorrect table definition; there can be only one auto column and it must be defined as a key', source: statement };
      }
      columns[placeholderIndex] = columns[placeholderIndex].replace('__AUTO_PRIMARY__', 'PRIMARY KEY AUTOINCREMENT');
      tablePrimaryKey = null;
    }
  }
  if (tablePrimaryKey) columns.push(`PRIMARY KEY (${tablePrimaryKey.map(quoteIdentifier).join(', ')})`);
  // 괄호 뒤 테이블 옵션(ENGINE=…, DEFAULT CHARSET=…, AUTO_INCREMENT=…, COMMENT=…)은 SQLite에 없으므로 버린다.
  const create = `CREATE ${header[1] ?? ''}TABLE ${header[2] ?? ''}${quoteIdentifier(tableName)} (${columns.join(', ')})`;
  return { kind: 'sql', sql: [create, ...indexes], source: statement };
}

/** 한 문장을 SQLite가 실행할 형태로 바꾼다. */
export function translateMysqlStatement(statement: string): CompatStatement {
  const sql = statement.trim();
  let match: RegExpMatchArray | null;
  if ((match = sql.match(/^SHOW\s+(FULL\s+)?TABLES(?:\s+(?:FROM|IN)\s+\S+)?$/i))) return { kind: 'show-tables', full: Boolean(match[1]), source: sql };
  if (/^SHOW\s+(DATABASES|SCHEMAS)$/i.test(sql)) return { kind: 'show-databases', source: sql };
  if ((match = sql.match(new RegExp(String.raw`^(?:DESCRIBE|DESC|EXPLAIN)\s+(${qualified})$`, 'i')))) return { kind: 'describe', table: unquoteIdentifier(match[1]), source: sql };
  if ((match = sql.match(new RegExp(String.raw`^SHOW\s+(?:FULL\s+)?(?:COLUMNS|FIELDS)\s+(?:FROM|IN)\s+(${qualified})$`, 'i')))) return { kind: 'describe', table: unquoteIdentifier(match[1]), source: sql };
  if ((match = sql.match(new RegExp(String.raw`^SHOW\s+CREATE\s+TABLE\s+(${qualified})$`, 'i')))) return { kind: 'show-create', table: unquoteIdentifier(match[1]), source: sql };
  if ((match = sql.match(new RegExp(String.raw`^USE\s+(${identifier})$`, 'i')))) return { kind: 'use', database: unquoteIdentifier(match[1]), source: sql };
  if (/^(ATTACH|DETACH)\b/i.test(sql)) return { kind: 'error', message: `${sql.split(/\s+/)[0].toUpperCase()} is not allowed: 다른 Database 파일에는 접근할 수 없습니다`, source: sql };
  if (/^CREATE\s+(TEMPORARY\s+)?TABLE\b/i.test(sql)) return translateCreateTable(sql);
  if ((match = sql.match(new RegExp(String.raw`^TRUNCATE\s+(?:TABLE\s+)?(${qualified})$`, 'i')))) {
    return { kind: 'truncate', table: unquoteIdentifier(match[1]), source: sql };
  }
  if (/^INSERT\s+IGNORE\b/i.test(sql)) return { kind: 'sql', sql: [translateExpressions(sql.replace(/^INSERT\s+IGNORE\b/i, 'INSERT OR IGNORE'))], source: sql };
  if (/^START\s+TRANSACTION$/i.test(sql)) return { kind: 'sql', sql: ['BEGIN'], source: sql };
  return { kind: 'sql', sql: [translateExpressions(sql)], source: sql };
}
