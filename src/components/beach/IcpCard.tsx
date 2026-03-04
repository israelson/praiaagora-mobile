import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { theme } from '../../theme';

interface IcpBreakdownItem {
  score: number;
  description?: string;
}

interface IcpBreakdown {
  water_quality?: IcpBreakdownItem;
  temperature?: IcpBreakdownItem;
  wind?: IcpBreakdownItem;
  uv?: IcpBreakdownItem;
  precipitation?: IcpBreakdownItem;
  crowd?: IcpBreakdownItem;
}

interface Props {
  icp: number;
  icp_rating: string;
  icp_breakdown?: IcpBreakdown;
}

const BREAKDOWN_ITEMS: { key: keyof IcpBreakdown; label: string; icon: string }[] = [
  { key: 'water_quality', label: 'Qualidade da Água', icon: 'water' },
  { key: 'temperature', label: 'Temperatura', icon: 'thermometer' },
  { key: 'wind', label: 'Vento', icon: 'flag' },
  { key: 'uv', label: 'Índice UV', icon: 'sunny' },
  { key: 'precipitation', label: 'Precipitação', icon: 'rainy' },
  { key: 'crowd', label: 'Lotação', icon: 'people' },
];

function barColor(score: number) {
  if (score >= 80) return theme.colors.success;
  if (score >= 60) return theme.colors.info;
  return theme.colors.warning;
}

export default function IcpCard({ icp, icp_rating, icp_breakdown }: Props) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setShowBreakdown((s) => !s)} activeOpacity={0.8}>
        <Card style={styles.icpCard}>
          <View style={styles.icpHeader}>
            <Text style={styles.icpLabel}>Índice de Conforto Praial</Text>
            <View style={styles.icpHeaderRight}>
              <Badge
                label={icp_rating}
                variant={icp >= 80 ? 'success' : icp >= 60 ? 'info' : 'warning'}
              />
              <Ionicons
                name={showBreakdown ? 'caret-up' : 'caret-down'}
                size={18}
                color={theme.colors.textInverse}
                style={{ marginLeft: 8 }}
              />
            </View>
          </View>
          <Text style={styles.icpScore}>{icp.toFixed(0)}</Text>
          <Text style={styles.icpDescription}>
            {icp >= 80
              ? 'Condições excelentes para aproveitar a praia!'
              : icp >= 60
              ? 'Boas condições para ir à praia'
              : 'Condições regulares — toque para ver a composição do índice'}
          </Text>
        </Card>
      </TouchableOpacity>

      {icp_breakdown && (
        <Modal
          visible={showBreakdown}
          animationType="slide"
          transparent
          onRequestClose={() => setShowBreakdown(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Composição do ICP</Text>
                <TouchableOpacity onPress={() => setShowBreakdown(false)}>
                  <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <View style={styles.breakdownContainer}>
                  <Text style={styles.breakdownSubtitle}>
                    Veja como calculamos o Índice de Conforto Praial:
                  </Text>
                  {BREAKDOWN_ITEMS.map(({ key, label, icon }) => {
                    const item = key === 'water_quality'
                      ? icp_breakdown.water_quality ?? { score: 0 }
                      : icp_breakdown[key];
                    if (!item) return null;
                    const score = item.score ?? 0;
                    return (
                      <View key={key} style={styles.breakdownItem}>
                        <View style={styles.breakdownRow}>
                          <View style={styles.breakdownLabel}>
                            <Ionicons name={icon as any} size={18} color={theme.colors.primary} />
                            <Text style={styles.breakdownText}>{label}</Text>
                          </View>
                          <Text style={styles.breakdownScore}>{score.toFixed(0)}</Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              { width: `${score}%`, backgroundColor: barColor(score) },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  icpCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  icpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  icpHeaderRight: { flexDirection: 'row', alignItems: 'center' },
  icpLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textInverse,
    fontWeight: theme.fontWeight.semibold,
  },
  icpScore: {
    fontSize: 64,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textInverse,
    textAlign: 'center',
    marginVertical: theme.spacing.sm,
  },
  icpDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textInverse,
    textAlign: 'center',
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  breakdownContainer: { padding: theme.spacing.md, gap: theme.spacing.md },
  breakdownSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  breakdownItem: { gap: theme.spacing.xs },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  breakdownLabel: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  breakdownText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  breakdownScore: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  barTrack: {
    height: 8,
    backgroundColor: theme.colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
});
