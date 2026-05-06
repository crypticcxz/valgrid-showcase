set -euo pipefail
cd "$(dirname "$0")"

node_modules/.bin/eslint web api \
  --no-config-lookup \
  --ext .jsx \
  --parser-options '{"ecmaVersion":"latest","sourceType":"module","ecmaFeatures":{"jsx":true}}' \
  --global window,document,console,fetch,crypto,alert,confirm,prompt,Buffer,process,URL,AbortController,TextDecoder,TextEncoder,setTimeout,clearTimeout,setInterval,clearInterval \
  --plugin react \
  --plugin react-hooks \
  --rule 'semi:["error","never"]' \
  --rule 'eqeqeq:["error","always"]' \
  --rule 'no-unused-vars:["error",{"argsIgnorePattern":"^_"}]' \
  --rule 'no-duplicate-imports:error' \
  --rule 'no-useless-assignment:error' \
  --rule 'prefer-const:error' \
  --rule 'react-hooks/rules-of-hooks:error' \
  --rule 'react-hooks/exhaustive-deps:warn' \
  --rule 'react/react-in-jsx-scope:off' \
  --rule 'react/jsx-uses-vars:error' \
  --rule 'react/prop-types:off'
