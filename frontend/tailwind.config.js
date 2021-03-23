module.exports = {
    purge: ['./public/**/*.html', './src/**/*.vue'],
    darkMode: false, // or 'media' or 'class'
    theme: {
        extend: {
            colors: {
                accent: '#4EC48F',
                icon: '#44A687',
            },
        },
    },
    variants: {
        extend: {},
    },
};
