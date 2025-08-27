// tailwind.config.js
module.exports = {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                border: "#e2e8f0", // Adding border color
                primary: {
                    DEFAULT: '#1E1E1E',
                    light: '#2D2D2D',
                    dark: '#121212',
                },
                accent: {
                    DEFAULT: '#3E64FF',
                    hover: '#2F55E3',
                },
                text: {
                    primary: '#FFFFFF',
                    secondary: '#A0A0A0',
                },
                background: "#ffffff", // Adding background color
                foreground: "#000000", // Adding foreground color
            },
        },
    },
    plugins: [],
}