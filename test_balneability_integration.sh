#!/bin/bash

# Script de verificação da integração de Balneabilidade no Mobile
# Execute: bash mobile/test_balneability_integration.sh

echo "🧪 TESTE DE INTEGRAÇÃO - BALNEABILIDADE MOBILE"
echo "=============================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Função de teste
test_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        ((FAILED++))
        return 1
    fi
}

# Função para verificar conteúdo
test_content() {
    local file=$1
    local pattern=$2
    local description=$3
    
    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        ((FAILED++))
        return 1
    fi
}

echo "📁 VERIFICANDO ARQUIVOS..."
echo ""

# Verificar componentes
test_file "mobile/src/components/beach/BeachCard.tsx" "BeachCard.tsx existe"
test_file "mobile/src/components/beach/WaterQualityBadge.tsx" "WaterQualityBadge.tsx existe (NOVO)"

# Verificar telas
test_file "mobile/src/screens/main/HomeScreen.tsx" "HomeScreen.tsx existe"
test_file "mobile/src/screens/main/ExploreScreen.tsx" "ExploreScreen.tsx existe"
test_file "mobile/src/screens/main/BeachDetailScreen.tsx" "BeachDetailScreen.tsx existe"

# Verificar serviços
test_file "mobile/src/services/api.ts" "api.ts existe"

# Verificar documentação
test_file "mobile/BALNEABILITY_INTEGRATION.md" "Documentação de integração existe (NOVO)"

echo ""
echo "🔍 VERIFICANDO CONTEÚDO DOS ARQUIVOS..."
echo ""

# BeachCard - Interface Beach atualizada
test_content "mobile/src/components/beach/BeachCard.tsx" "water_quality.*PROPER.*IMPROPER" \
    "BeachCard: Interface Beach com tipos PROPER/IMPROPER"

test_content "mobile/src/components/beach/BeachCard.tsx" "getWaterQualityBadge" \
    "BeachCard: Método getWaterQualityBadge implementado"

# WaterQualityBadge
test_content "mobile/src/components/beach/WaterQualityBadge.tsx" "WaterQualityBadge" \
    "WaterQualityBadge: Component export"

test_content "mobile/src/components/beach/WaterQualityBadge.tsx" "PROPER.*IMPROPER" \
    "WaterQualityBadge: Suporta PROPER/IMPROPER"

# ExploreScreen - Filtros
test_content "mobile/src/screens/main/ExploreScreen.tsx" "WATER_QUALITY_FILTERS" \
    "ExploreScreen: Constante WATER_QUALITY_FILTERS definida"

test_content "mobile/src/screens/main/ExploreScreen.tsx" "waterQualityFilter" \
    "ExploreScreen: Estado waterQualityFilter"

test_content "mobile/src/screens/main/ExploreScreen.tsx" "Qualidade da Água" \
    "ExploreScreen: Label do filtro de qualidade"

# BeachDetailScreen - Seção de balneabilidade
test_content "mobile/src/screens/main/BeachDetailScreen.tsx" "Balneabilidade" \
    "BeachDetailScreen: Seção Balneabilidade"

test_content "mobile/src/screens/main/BeachDetailScreen.tsx" "water_quality_updated_at" \
    "BeachDetailScreen: Exibe data de atualização"

test_content "mobile/src/screens/main/BeachDetailScreen.tsx" "IMA-SC" \
    "BeachDetailScreen: Menciona fonte IMA-SC"

# API Service
test_content "mobile/src/services/api.ts" "getBalneabilityReport" \
    "api.ts: Método getBalneabilityReport"

echo ""
echo "📊 RESULTADO DOS TESTES"
echo "======================"
echo -e "${GREEN}Passou: $PASSED${NC}"
echo -e "${RED}Falhou: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM!${NC}"
    echo ""
    echo "🎉 Integração de Balneabilidade completa e validada!"
    echo ""
    echo "📱 Próximos passos:"
    echo "   1. Executar app mobile: cd mobile && npm start"
    echo "   2. Verificar visualmente no simulador/device"
    echo "   3. Testar filtros no ExploreScreen"
    echo "   4. Verificar badges nos cards"
    echo "   5. Conferir seção Balneabilidade no BeachDetailScreen"
    echo ""
    echo "📚 Documentação: mobile/BALNEABILITY_INTEGRATION.md"
    exit 0
else
    echo -e "${RED}❌ ALGUNS TESTES FALHARAM${NC}"
    echo ""
    echo "Verifique os arquivos marcados com ✗ acima."
    exit 1
fi
