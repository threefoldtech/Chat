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

            addVariant('collapsed-bar', ({ modifySelectors, separator }) => {
                modifySelectors(({ className }) => {
                    return `.collapsed-bar .${e(`collapsed-bar${separator}${className}`)}`;
                });
            });
        }),
    ],
    variants: {
        extend: {
            accessibility: ['my-message', 'collapsed-bar'],
            alignContent: ['my-message', 'collapsed-bar'],
            alignItems: ['my-message', 'collapsed-bar'],
            alignSelf: ['my-message', 'collapsed-bar'],
            animation: ['my-message', 'collapsed-bar'],
            appearance: ['my-message', 'collapsed-bar'],
            backgroundAttachment: ['my-message', 'collapsed-bar'],
            backgroundClip: ['my-message', 'collapsed-bar'],
            backgroundColor: ['my-message', 'collapsed-bar'],
            backgroundImage: ['my-message', 'collapsed-bar'],
            backgroundOpacity: ['my-message', 'collapsed-bar'],
            backgroundPosition: ['my-message', 'collapsed-bar'],
            backgroundRepeat: ['my-message', 'collapsed-bar'],
            backgroundSize: ['my-message', 'collapsed-bar'],
            borderCollapse: ['my-message', 'collapsed-bar'],
            borderColor: ['my-message', 'collapsed-bar'],
            borderOpacity: ['my-message', 'collapsed-bar'],
            borderRadius: ['my-message', 'collapsed-bar'],
            borderStyle: ['my-message', 'collapsed-bar'],
            borderWidth: ['my-message', 'collapsed-bar'],
            boxShadow: ['my-message', 'collapsed-bar'],
            boxSizing: ['my-message', 'collapsed-bar'],
            clear: ['my-message', 'collapsed-bar'],
            container: ['my-message', 'collapsed-bar'],
            cursor: ['my-message', 'collapsed-bar'],
            display: ['my-message', 'collapsed-bar'],
            divideColor: ['my-message', 'collapsed-bar'],
            divideOpacity: ['my-message', 'collapsed-bar'],
            divideStyle: ['my-message', 'collapsed-bar'],
            divideWidth: ['my-message', 'collapsed-bar'],
            fill: ['my-message', 'collapsed-bar'],
            flex: ['my-message', 'collapsed-bar'],
            flexDirection: ['my-message', 'collapsed-bar'],
            flexGrow: ['my-message', 'collapsed-bar'],
            flexShrink: ['my-message', 'collapsed-bar'],
            flexWrap: ['my-message', 'collapsed-bar'],
            float: ['my-message', 'collapsed-bar'],
            fontFamily: ['my-message', 'collapsed-bar'],
            fontSize: ['my-message', 'collapsed-bar'],
            fontSmoothing: ['my-message', 'collapsed-bar'],
            fontStyle: ['my-message', 'collapsed-bar'],
            fontVariantNumeric: ['my-message', 'collapsed-bar'],
            fontWeight: ['my-message', 'collapsed-bar'],
            gap: ['my-message', 'collapsed-bar'],
            gradientColorStops: ['my-message', 'collapsed-bar'],
            gridAutoColumns: ['my-message', 'collapsed-bar'],
            gridAutoFlow: ['my-message', 'collapsed-bar'],
            gridAutoRows: ['my-message', 'collapsed-bar'],
            gridColumn: ['my-message', 'collapsed-bar'],
            gridColumnEnd: ['my-message', 'collapsed-bar'],
            gridColumnStart: ['my-message', 'collapsed-bar'],
            gridRow: ['my-message', 'collapsed-bar'],
            gridRowEnd: ['my-message', 'collapsed-bar'],
            gridRowStart: ['my-message', 'collapsed-bar'],
            gridTemplateColumns: ['my-message', 'collapsed-bar'],
            gridTemplateRows: ['my-message', 'collapsed-bar'],
            height: ['my-message', 'collapsed-bar'],
            inset: ['my-message', 'collapsed-bar'],
            justifyContent: ['my-message', 'collapsed-bar'],
            justifyItems: ['my-message', 'collapsed-bar'],
            justifySelf: ['my-message', 'collapsed-bar'],
            letterSpacing: ['my-message', 'collapsed-bar'],
            lineHeight: ['my-message', 'collapsed-bar'],
            listStylePosition: ['my-message', 'collapsed-bar'],
            listStyleType: ['my-message', 'collapsed-bar'],
            margin: ['my-message', 'collapsed-bar'],
            maxHeight: ['my-message', 'collapsed-bar'],
            maxWidth: ['my-message', 'collapsed-bar'],
            minHeight: ['my-message', 'collapsed-bar'],
            minWidth: ['my-message', 'collapsed-bar'],
            objectFit: ['my-message', 'collapsed-bar'],
            objectPosition: ['my-message', 'collapsed-bar'],
            opacity: ['my-message', 'collapsed-bar'],
            order: ['my-message', 'collapsed-bar'],
            outline: ['my-message', 'collapsed-bar'],
            overflow: ['my-message', 'collapsed-bar'],
            overscrollBehavior: ['my-message', 'collapsed-bar'],
            padding: ['my-message', 'collapsed-bar'],
            placeContent: ['my-message', 'collapsed-bar'],
            placeItems: ['my-message', 'collapsed-bar'],
            placeSelf: ['my-message', 'collapsed-bar'],
            placeholderColor: ['my-message', 'collapsed-bar'],
            placeholderOpacity: ['my-message', 'collapsed-bar'],
            pointerEvents: ['my-message', 'collapsed-bar'],
            position: ['my-message', 'collapsed-bar'],
            resize: ['my-message', 'collapsed-bar'],
            ringColor: ['my-message', 'collapsed-bar'],
            ringOffsetColor: ['my-message', 'collapsed-bar'],
            ringOffsetWidth: ['my-message', 'collapsed-bar'],
            ringOpacity: ['my-message', 'collapsed-bar'],
            ringWidth: ['my-message', 'collapsed-bar'],
            rotate: ['my-message', 'collapsed-bar'],
            scale: ['my-message', 'collapsed-bar'],
            skew: ['my-message', 'collapsed-bar'],
            space: ['my-message', 'collapsed-bar'],
            stroke: ['my-message', 'collapsed-bar'],
            strokeWidth: ['my-message', 'collapsed-bar'],
            tableLayout: ['my-message', 'collapsed-bar'],
            textAlign: ['my-message', 'collapsed-bar'],
            textColor: ['my-message', 'collapsed-bar'],
            textDecoration: ['my-message', 'collapsed-bar'],
            textOpacity: ['my-message', 'collapsed-bar'],
            textOverflow: ['my-message', 'collapsed-bar'],
            textTransform: ['my-message', 'collapsed-bar'],
            transform: ['my-message', 'collapsed-bar'],
            transformOrigin: ['my-message', 'collapsed-bar'],
            transitionDelay: ['my-message', 'collapsed-bar'],
            transitionDuration: ['my-message', 'collapsed-bar'],
            transitionProperty: ['my-message', 'collapsed-bar'],
            transitionTimingFunction: ['my-message', 'collapsed-bar'],
            translate: ['my-message', 'collapsed-bar'],
            userSelect: ['my-message', 'collapsed-bar'],
            verticalAlign: ['my-message', 'collapsed-bar'],
            visibility: ['my-message', 'collapsed-bar'],
            whitespace: ['my-message', 'collapsed-bar'],
            width: ['my-message', 'collapsed-bar'],
            wordBreak: ['my-message', 'collapsed-bar'],
            zIndex: ['my-message', 'collapsed-bar'],
        },
    },
};
