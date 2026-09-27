const fs = require('node:fs');
const { buildSync } = require('esbuild');
buildSync({stdin:{contents:'import {createClient} from "@supabase/supabase-js"; window.createOnlineClient=createClient;',resolveDir:process.cwd()},bundle:true,minify:true,platform:'browser',format:'iife',outfile:'dist/vendor/supabase.js'});
if(!fs.existsSync('dist/index.html')) throw new Error('Entrada do jogo não encontrada');
console.log('Jogo preparado para Vercel. Nenhuma chave privada foi incluída no navegador.');
