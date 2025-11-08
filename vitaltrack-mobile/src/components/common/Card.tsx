import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Card as PaperCard } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows } from '../../theme/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevation?: number;
}

const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  elevation = 2,
}) => {
  const CardComponent = onPress ? TouchableOpacity : PaperCard;
  const cardProps = onPress
    ? {
        onPress,
        activeOpacity: 0.7,
        style: [styles.card, style],
      }
    : {
        elevation,
        style: [styles.card, style],
      };

  return <CardComponent {...cardProps}>{children}</CardComponent>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
});

export default Card;
