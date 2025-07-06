const fs = require('fs');
const path = require('path');
const recast = require('recast');

/**
 * Удаляет console.log из AST.
 * @param {string} filePath
 */
function removeConsoleLogs(filePath) {
  const ext = path.extname(filePath);
  if (ext !== '.js' && ext !== '.ts') {
    return; // Пропускаем не JS/TS файлы
  }

  const code = fs.readFileSync(filePath, 'utf8');

  const ast = recast.parse(code, {
    parser: require('@babel/parser'),
  });

  let modified = false;

  recast.types.visit(ast, {
    visitCallExpression(path) {
      const { node } = path;

      if (
        node.callee &&
        node.callee.object &&
        node.callee.object.name === 'console' &&
        node.callee.property &&
        node.callee.property.name === 'log'
      ) {
        // Удаляем весь statement с console.log
        if (
          path.parentPath &&
          path.parentPath.value &&
          (path.parentPath.value.type === 'ExpressionStatement' ||
           path.parentPath.value.type === 'AwaitExpression')
        ) {
          path.parentPath.prune();
        } else {
          path.prune();
        }

        modified = true;
        return false; // Не заходить внутрь удаляемого узла
      }

      this.traverse(path);
    }
  });

  if (modified) {
    const output = recast.print(ast).code;
    fs.writeFileSync(filePath, output, 'utf8');
    console.log(`Удалены console.log в ${filePath}`);
  }
}

/**
 * Рекурсивный обход папки.
 * @param {string} dir
 */
function traverseDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      traverseDirectory(fullPath);
    } else if (entry.isFile()) {
      removeConsoleLogs(fullPath);
    }
  }
}

// === Точка входа ===

const targetDir = process.argv[2];

if (!targetDir) {
  console.error('Укажи путь к папке как аргумент. Например: node removeConsoleLogs.js ./src');
  process.exit(1);
}

if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
  console.error('Указанный путь не существует или это не папка.');
  process.exit(1);
}

traverseDirectory(targetDir);
console.log('Удаление console.log завершено.');
