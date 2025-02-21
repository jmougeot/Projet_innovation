const COLORS = {
    primary: '#194A8D',
    secondary: '#CAE1EF',
    background: '#F3EFEF',
    text: {
        primary: '#083F8C',
        secondary: '#666666',
        light: '#FFFFFF'
    },
    accent: '#2196F3'
};

const FONTS = {
    title: {
        fontFamily: 'Playfair-Display',
        bold: 'Playfair-Display-Bold',
        italic: 'Playfair-Display-Italic'
    },
    body: {
        regular: 'Poppins-Regular',
        medium: 'Poppins-Medium',
        bold: 'Poppins-Bold'
    }
};

const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
};

const SHADOWS = {
    light: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
    }
};

const theme = {
    COLORS,
    FONTS,
    SPACING,
    SHADOWS
};

export { COLORS, FONTS, SPACING, SHADOWS };
export default theme;
