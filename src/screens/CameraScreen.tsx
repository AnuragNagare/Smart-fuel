import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image as RNImage,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import LoadingScreen from '../components/LoadingScreen';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Camera'>;

interface Props {
    navigation: CameraScreenNavigationProp;
}

export default function CameraScreen({ navigation }: Props) {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>
                        We need your permission to access the camera
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const handleCapture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.2, // Lower quality to keep payload small for Groq Vision
                    base64: true,
                });

                if (photo && photo.uri && photo.base64) {
                    setIsAnalyzing(true);

                    // Import services
                    const { analyzeFood } = await import('../services/api');
                    const { getUserProfile, getBMI } = await import('../services/storage');

                    // Get user profile for personalized insights
                    const profile = await getUserProfile();
                    const userBMI = await getBMI();

                    let userProfile = undefined;
                    if (profile && userBMI) {
                        userProfile = {
                            ...profile,
                            bmi: userBMI,
                        };
                    }

                    // Analyze the image
                    const report = await analyzeFood(photo.base64, userProfile);

                    // Navigate to results with actual data
                    navigation.navigate('Results', {
                        report,
                        imageUri: photo.uri,
                    });
                }
            } catch (error) {
                console.error('Capture/Analysis error:', error);
                alert('Failed to analyze image. Please try again.');
                setIsAnalyzing(false);
                navigation.goBack();
            }
        }
    };
    const toggleCameraFacing = () => {
        setFacing((current) => (current === 'back' ? 'front' : 'back'));
    };

    return (
        <View style={styles.container}>
            <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Take a photo</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                        <Text style={styles.flipText}>🔄</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
                        <View style={styles.captureButtonInner} />
                    </TouchableOpacity>

                    <View style={{ width: 60 }} />
                </View>
            </CameraView>
            {isAnalyzing && <LoadingScreen />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgPrimary,
    },
    camera: {
        flex: 1,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xxxl,
    },
    permissionText: {
        color: COLORS.textPrimary,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    permissionButton: {
        backgroundColor: COLORS.accentPrimary,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xxxl,
        borderRadius: RADIUS.md,
    },
    permissionButtonText: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '700',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xl,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        color: COLORS.textPrimary,
        fontSize: 20,
        fontWeight: '600',
    },
    headerTitle: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    controls: {
        position: 'absolute',
        bottom: 60, // Increased for system navigation
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: SPACING.xxxl,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLORS.textPrimary,
    },
    flipButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    flipText: {
        fontSize: 24,
    },
});
