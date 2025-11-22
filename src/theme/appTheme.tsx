import { StyleSheet } from 'react-native';

export const colores = {
    primary: '#5856D6',
}

export const theme = {
    colors: {
        primaryColor: "#6200ea",
        accentColor: "#00b0ff",
        backgroundColor: "#ffffff",
        textColor: "#000000",
        cardColor: "#f5f5f5",
        buttonColor: "#6200ea",
        navColor: "#ffffff",
    }
}

export const styles = StyleSheet.create({
    globalMargin: {
        marginHorizontal: 10
    },
    title: {
        fontSize: 28,
        marginBottom: 5,
        fontWeight: 'bold'
    },
    texto: {
        fontSize: 20,
        marginBottom: 10
    },
    botonGrande: {
        width: 150,
        height: 100,
        backgroundColor: 'red',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        marginTop: 10
    },
    botonGrandeTexto: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    },
    avatarContainer: {
        alignItems: 'center',
        marginTop: 5,
    },
    avatar: {
        width: 150,
        height: 150,
        borderRadius: 100
    },
    menuContainer: {
        marginVertical: 30,
        marginHorizontal: 45,
    },
    menuBoton: {
        marginVertical: 10
    },
    menuTexto: {
        fontSize: 20
    },
    perfilImage: {
        width: 120,
        height: 120,
        borderRadius: 100,
        marginTop: 15,
        marginBottom: 30,
    },
    switchContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
        flexDirection: 'row',
    },
});