import React from 'react';
import { TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width / 3 - 10; // 3 columns

interface Props {
    uri: string;
    onPress: () => void;
    style?: {}
}

export const GalleryPhoto = ({ uri, onPress, style }: Props) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
            <Image source={{ uri }} style={ style ? style : styles.image} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 4,
    },
    image: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: 8,
    }
});