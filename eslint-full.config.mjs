import prettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';
import baseConfig from './eslint.config.mjs';

export default tseslint.config(...baseConfig, prettierRecommended);
