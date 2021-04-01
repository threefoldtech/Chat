const plugin = require('tailwindcss/plugin');

module.exports = {
    purge: ['./public/**/*.html', './src/**/*.vue'],
    darkMode: false, // or 'media' or 'class'
    theme: {
        extend: {
            colors: {
                accent: '#4EC48F',
                icon: '#44A687',
                my: '#d0f0c0',
            },
        },
    },
    plugins: [
        plugin(function({ addVariant, e }) {
            addVariant('my-message', ({ modifySelectors, separator }) => {
                modifySelectors(({ className }) => {
                    return `.my-message .${e(`my-message${separator}${className}`)}`;
                });
            });
        }),
    ],
    variants: {
        extend: {
            accessibility: ['my-message'],
            alignContent: ['my-message'],
            alignItems: ['my-message'],
            alignSelf: ['my-message'],
            animation: ['my-message'],
            appearance: ['my-message'],
            backgroundAttachment: ['my-message'],
            backgroundClip: ['my-message'],
            backgroundColor: ['my-message'],
            backgroundImage: ['my-message'],
            backgroundOpacity: ['my-message'],
            backgroundPosition: ['my-message'],
            backgroundRepeat: ['my-message'],
            backgroundSize: ['my-message'],
            borderCollapse: ['my-message'],
            borderColor: ['my-message'],
            borderOpacity: ['my-message'],
            borderRadius: ['my-message'],
            borderStyle: ['my-message'],
            borderWidth: ['my-message'],
            boxShadow: ['my-message'],
            boxSizing: ['my-message'],
            clear: ['my-message'],
            container: ['my-message'],
            cursor: ['my-message'],
            display: ['my-message'],
            divideColor: ['my-message'],
            divideOpacity: ['my-message'],
            divideStyle: ['my-message'],
            divideWidth: ['my-message'],
            fill: ['my-message'],
            flex: ['my-message'],
            flexDirection: ['my-message'],
            flexGrow: ['my-message'],
            flexShrink: ['my-message'],
            flexWrap: ['my-message'],
            float: ['my-message'],
            fontFamily: ['my-message'],
            fontSize: ['my-message'],
            fontSmoothing: ['my-message'],
            fontStyle: ['my-message'],
            fontVariantNumeric: ['my-message'],
            fontWeight: ['my-message'],
            gap: ['my-message'],
            gradientColorStops: ['my-message'],
            gridAutoColumns: ['my-message'],
            gridAutoFlow: ['my-message'],
            gridAutoRows: ['my-message'],
            gridColumn: ['my-message'],
            gridColumnEnd: ['my-message'],
            gridColumnStart: ['my-message'],
            gridRow: ['my-message'],
            gridRowEnd: ['my-message'],
            gridRowStart: ['my-message'],
            gridTemplateColumns: ['my-message'],
            gridTemplateRows: ['my-message'],
            height: ['my-message'],
            inset: ['my-message'],
            justifyContent: ['my-message'],
            justifyItems: ['my-message'],
            justifySelf: ['my-message'],
            letterSpacing: ['my-message'],
            lineHeight: ['my-message'],
            listStylePosition: ['my-message'],
            listStyleType: ['my-message'],
            margin: ['my-message'],
            maxHeight: ['my-message'],
            maxWidth: ['my-message'],
            minHeight: ['my-message'],
            minWidth: ['my-message'],
            objectFit: ['my-message'],
            objectPosition: ['my-message'],
            opacity: ['my-message'],
            order: ['my-message'],
            outline: ['my-message'],
            overflow: ['my-message'],
            overscrollBehavior: ['my-message'],
            padding: ['my-message'],
            placeContent: ['my-message'],
            placeItems: ['my-message'],
            placeSelf: ['my-message'],
            placeholderColor: ['my-message'],
            placeholderOpacity: ['my-message'],
            pointerEvents: ['my-message'],
            position: ['my-message'],
            resize: ['my-message'],
            ringColor: ['my-message'],
            ringOffsetColor: ['my-message'],
            ringOffsetWidth: ['my-message'],
            ringOpacity: ['my-message'],
            ringWidth: ['my-message'],
            rotate: ['my-message'],
            scale: ['my-message'],
            skew: ['my-message'],
            space: ['my-message'],
            stroke: ['my-message'],
            strokeWidth: ['my-message'],
            tableLayout: ['my-message'],
            textAlign: ['my-message'],
            textColor: ['my-message'],
            textDecoration: ['my-message'],
            textOpacity: ['my-message'],
            textOverflow: ['my-message'],
            textTransform: ['my-message'],
            transform: ['my-message'],
            transformOrigin: ['my-message'],
            transitionDelay: ['my-message'],
            transitionDuration: ['my-message'],
            transitionProperty: ['my-message'],
            transitionTimingFunction: ['my-message'],
            translate: ['my-message'],
            userSelect: ['my-message'],
            verticalAlign: ['my-message'],
            visibility: ['my-message'],
            whitespace: ['my-message'],
            width: ['my-message'],
            wordBreak: ['my-message'],
            zIndex: ['my-message'],
        },
    },
};
