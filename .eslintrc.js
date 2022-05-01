const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
  root: true, // 指定为根配置，防止有上级的 eslint 继续向上查找配置文件
  env: {
    node: true,
    es6: true, // 开启 es6 支持
  },
  parserOptions: { ecmaVersion: 13 },
  extends: ['plugin:prettier/recommended', 'prettier'],
  plugins: ['prettier'],
});
