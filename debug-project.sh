#!/usr/bin/env bash
# debug-project.sh
# Script pour diagnostiquer les erreurs de résolution de modules et usages dépréciés

echo "🚀 Debugging project..."

# 1. Vérifier la résolution des modules manquants
modules=(
  "react-native-web/dist/index"
  "react-native-web/dist/exports/ScrollView"
)
for m in "${modules[@]}"; do
  node -e "try { console.log(require.resolve('$m')); } catch (e) { console.error('❌ NOT FOUND'); }"
done

# 2. Afficher la version installée de react-native-web et react-dom
npm ls react-native-web react-dom --depth=0 || true

grep -R "pointerEvents=" -n ./app || echo "Aucun usage direct trouvé"
grep -R "shadow[A-Za-z]" -n ./app || echo "Aucun usage trouvé"



echo -e "\n✅ Debug terminé."
