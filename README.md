# Cerro Azul Viva — online

Jogo 3D com 26 missões. Integração com contas, avatares, chat por texto mediante convite e grupos de até quatro jogadores. O grupo compartilha objetivos e moedas, preservando a partida individual.

## Estado

Código preparado e testes locais disponíveis. Ainda falta configurar Supabase e publicar na Vercel para verificar duas contas em dispositivos diferentes. Sem configuração, o modo individual funciona e o modo online informa que está indisponível.

## Configurar e publicar

1. Crie um projeto Supabase. Execute supabase/001_multiplayer.sql uma vez no SQL Editor de um projeto novo.
2. Mantenha a confirmação de e-mail habilitada. Configure o endereço público da Vercel em Authentication / URL Configuration (Site URL e Redirect URLs).
3. Nas configurações de Realtime, desabilite canais públicos. O jogo utiliza canais privados.
4. Envie ao GitHub as pastas dist, api, server, scripts, supabase e test, além de package.json, package-lock.json, vercel.json, README.md e .gitignore. Não envie .env, node_modules, .vercel, .openai ou arquivos ZIP.
5. Na Vercel, importe o repositório. Use Framework Other, instalação npm ci, build npm run build e saída dist. O vercel.json já define esses valores.
6. Configure na Vercel SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY e SUPABASE_SERVICE_ROLE_KEY. A última chave é exclusiva do servidor: nunca a coloque no GitHub ou nos arquivos públicos.
7. Publique e teste duas contas: confirmação do e-mail, avatar, presença, convite de conversa, texto, grupo, missões alternadas e recuperação do progresso individual ao sair do grupo.

## Testes

Execute npm ci, npm test e npm run build. Os testes cobrem as 26 missões cooperativas, recompensas repetidas, proximidade, consentimento do chat, isolamento de mensagens, bloqueio, grupos e gravação atômica. O teste do banco usa PostgreSQL em memória; Auth e Realtime precisam de validação no serviço publicado.

## Controles

WASD/setas ou clique para caminhar, E para interagir, Shift para correr, Espaço para pular, V para bicicleta, C para câmera, R para chuva, M para mapa e P para pausar. Celulares têm controles na tela. Requer WebGL.

Use Criar conta ou entrar online para encontrar amigos. Conversas precisam ser aceitas; é possível encerrá-las ou bloquear jogadores. Contas salvam a partida individual na nuvem; visitantes salvam no navegador. O chat é somente texto.

A modelagem usa referências visuais fornecidas pelo usuário, com dimensões aproximadas e atividades fictícias. Não distribui fotografias originais.
