# Skull Snake

Jogo web simples — Skull Snake

Como usar no GitHub Pages

- Coloque o repositório no GitHub.
- Nas configurações do repositório, ative GitHub Pages apontando para a branch `main` (ou `gh-pages`) e a pasta `/`.
- O site ficará disponível em `https://<seu-usuario>.github.io/<seu-repositorio>/`.

Meta tags de compartilhamento

- A página usa a imagem `assets/favicon.png` para Open Graph/Twitter.
- Para melhor pré-visualização em redes sociais, substitua por uma imagem com 1200×630px e o mesmo nome, ou atualize `og:image` em `index.html`.

Servir localmente

```bash
# servidor simples em Python 3
python3 -m http.server 8000
# então abra http://localhost:8000
```

Sugestão

- Recomendo criar uma imagem `assets/og-image.png` com 1200×630px para garantir ótima aparência ao compartilhar.
