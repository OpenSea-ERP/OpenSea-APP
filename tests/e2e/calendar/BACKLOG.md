# Calendar E2E Backlog

## Sprint P1 (alto impacto de interface)

1. Navegação de período (`prev/next/today`) no FullCalendar.
2. Troca de visualização (`Mês/Semana/Dia/Agenda`) com validação de estado ativo.
3. Estado vazio em lista com filtros combinados.
4. Criação com campos avançados (descrição, local, visibilidade, timezone, all-day, cor).
5. Recorrência via UI com validação de badge "Recorrente".
6. Fluxos de cancelamento em create/edit sem persistência de mudança.

## Sprint P2 (interações avançadas no detalhe)

1. Renderização completa do detalhe (badges, metadados, formatação de data all-day).
2. Remover participante com PIN (sucesso e erro de PIN).
3. Lembrete "Sem lembrete" (remoção) e manutenção de estado no select.
4. Convite: estados "nenhum usuário", filtragem de participantes já incluídos.
5. Edição com campos previamente preenchidos autoexpandidos.

## Sprint P3 (regressão e rotas relacionadas)

1. Ação "Ver origem" para evento de sistema com navegação correta.
2. Cobertura de erro visual com interceptação para ações principais (create/edit/delete/invite/reminder).
3. Cobertura de permissão + ownership mais granular em combinações de cenários.
