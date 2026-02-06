import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { theme } from '../../theme';

export default function PartnerDetailScreen({ route }: any) {
  const { partnerId } = route.params;
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartnerData();
  }, [partnerId]);

  const loadPartnerData = async () => {
    try {
      const data = await api.getPartnerById(partnerId);
      setPartner(data);
    } catch (error) {
      console.error('Error loading partner data:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do parceiro');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPhone = () => {
    if (partner?.phone) {
      Linking.openURL(`tel:${partner.phone}`);
    }
  };

  const handleOpenWebsite = () => {
    if (partner?.website) {
      Linking.openURL(partner.website);
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: any = {
      HOTEL: 'bed',
      RESTAURANT: 'restaurant',
      SURF_SCHOOL: 'fitness',
      EQUIPMENT_RENTAL: 'cart',
      OTHER: 'business',
    };
    return iconMap[category] || 'business';
  };

  const getCategoryLabel = (category: string) => {
    const labelMap: any = {
      HOTEL: 'Hotel',
      RESTAURANT: 'Restaurante',
      SURF_SCHOOL: 'Escola de Surf',
      EQUIPMENT_RENTAL: 'Aluguel de Equipamentos',
      OTHER: 'Outros',
    };
    return labelMap[category] || category;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!partner) return null;

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={getCategoryIcon(partner.category)}
            size={48}
            color={theme.colors.textInverse}
          />
        </View>
        <Text style={styles.partnerName}>{partner.name}</Text>
        <Text style={styles.categoryLabel}>
          {getCategoryLabel(partner.category)}
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {partner.description && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre</Text>
            <Text style={styles.descriptionText}>{partner.description}</Text>
          </Card>
        )}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Informações de Contato</Text>
          
          {partner.phone && (
            <TouchableOpacity style={styles.contactItem} onPress={handleOpenPhone}>
              <Ionicons name="call" size={24} color={theme.colors.primary} />
              <Text style={styles.contactText}>{partner.phone}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}

          {partner.email && (
            <TouchableOpacity style={styles.contactItem}>
              <Ionicons name="mail" size={24} color={theme.colors.primary} />
              <Text style={styles.contactText}>{partner.email}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}

          {partner.website && (
            <TouchableOpacity style={styles.contactItem} onPress={handleOpenWebsite}>
              <Ionicons name="globe" size={24} color={theme.colors.primary} />
              <Text style={styles.contactText}>Website</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}

          {partner.address && (
            <View style={styles.contactItem}>
              <Ionicons name="location" size={24} color={theme.colors.primary} />
              <Text style={styles.contactText}>{partner.address}</Text>
            </View>
          )}
        </Card>

        {partner.features && partner.features.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Características</Text>
            <View style={styles.features}>
              {partner.features.map((feature: string, index: number) => (
                <View key={index} style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        <View style={styles.actions}>
          {partner.phone && (
            <Button
              title="Ligar"
              onPress={handleOpenPhone}
              fullWidth
            />
          )}
          {partner.website && (
            <Button
              title="Visitar Website"
              variant="outline"
              onPress={handleOpenWebsite}
              fullWidth
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  partnerName: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textInverse,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  categoryLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textInverse,
    opacity: 0.9,
  },
  content: {
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  descriptionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  contactText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  features: {
    gap: theme.spacing.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  featureText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  actions: {
    gap: theme.spacing.sm,
  },
});
