import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

interface Props {
    message?: string;
    submessage?: string;
}

export default function LoadingScreen({
    message = 'Analyzing your meal...',
    submessage = 'Identifying food items and calculating nutrition'
}: Props) {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={COLORS.accentPrimary} />
            <Text style={styles.message}>{message}</Text>
            {submessage && <Text style={styles.submessage}>{submessage}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.bgPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    message: {
        marginTop: SPACING.xl,
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    submessage: {
        marginTop: SPACING.sm,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
});
