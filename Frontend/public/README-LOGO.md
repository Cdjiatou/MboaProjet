# Instructions pour ajouter le logo MBOA NEXT STAR

## Logo fourni
Le logo officiel MBOA NEXT STAR a été fourni avec :
- Étoile dorée stylisée avec cercle
- Texte "MBOA" en doré
- Texte "NEXT" en rouge
- Texte "STAR" en style graffiti doré
- Fond noir transparent

## Installation du logo

### Option 1 : Fichier direct (Rapide)
1. Sauvegarder l'image du logo sous le nom `logo.png` dans ce dossier (`Frontend/public/`)
2. Le logo sera automatiquement affiché dans :
   - Le Header (navbar)
   - Le Footer
   - Toutes les pages du site

### Option 2 : Via l'interface admin (Recommandé)
1. Se connecter à l'interface admin
2. Aller dans "Gestion du contenu" ou "Paramètres du site"
3. Section "Logo du site"
4. Uploader le fichier logo (formats acceptés : PNG, JPG, WebP, SVG)
5. Le logo sera stocké en base de données et synchronisé partout

## Spécifications techniques

### Format recommandé
- **Format** : PNG avec transparence
- **Dimensions** : 400x200px (ratio 2:1)
- **Poids** : < 200 KB
- **Résolution** : 2x pour écrans Retina

### Affichage actuel
- **Header** : Hauteur 40px (mobile) / 48px (desktop)
- **Footer** : Hauteur 40px
- **Style** : `object-contain` pour préserver les proportions

## Fichiers modifiés

Les composants suivants utilisent déjà le logo :
- `Frontend/src/components/shared/Header.tsx` (ligne 34-43)
- `Frontend/src/components/shared/Footer.tsx` (ligne 40-46)
- Store : `Frontend/src/store/useThemeStore.ts` (ligne 42)

## Fallback

Si aucun logo n'est trouvé, le système affiche un logo textuel stylisé :
```
⭐ MBOA NEXT STAR
```

## Notes

- Le logo est chargé depuis `assets.logo_url` ou `assets.site_logo`
- Valeur par défaut : `/logo.jpg`
- Le système vérifie d'abord la base de données, puis le fichier public
